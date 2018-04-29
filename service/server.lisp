(defpackage #:server
  (:use :cl)
  ;; (:use :cl :hunchentoot)
  (:export
   #:service-start
   #:service-stop
   #:game-create-run
   #:make-config
   ;; #:file-string #:list-directory-recursive #:list-directory #:list-to-hash-table
   )
  )

(in-package #:server)

(defstruct config
  port
  shapes-file
  seed
  grid-dimensions
  max-move-catchup-wait-secs
  )

(defvar config-default
  (make-config :port 4242
               :shapes-file nil ; use libtetris default
               :grid-dimensions nil ; use libtetris default
               :max-move-catchup-wait-secs 10))

(defstruct service
  config
  acceptor
  curr-game-no
  game-executions
  )

(defstruct game-execution
  game
  moves
  max-moves
  )

(defun main (argv)
  (declare (ignore argv))
  ;; TODO parse args
  (let ((config config-default))
    (service-start config))
  (loop do (game-create-run)))

(defvar *service* nil)

(defun service-start (config)
  (apply 'libtetris:init-tetris
         (append (when (config-shapes-file config)
                   (list :shapes-file (config-shapes-file config)))
                 (when (config-seed config)
                   (list :seed (config-seed config)))))

  (let ((acceptor (make-instance 'hunchentoot:easy-acceptor :port (config-port config))))
    (hunchentoot:start acceptor)
    (setf *service*
          (make-service :config (or config config-default)
                        :acceptor acceptor
                        :game-executions (make-hash-table)
                        :curr-game-no 0))))

(defun service-stop (service)
  (let ((acceptor (service-acceptor service)))
    (when (and acceptor (hunchentoot:started-p acceptor))
      (hunchentoot:stop acceptor)))
  ;; TODO kill running game threads
  )


(defmacro define-regexp-route (name (url-regexp &rest capture-names) &body body)
  `(progn
     (defun ,name ()
       (ppcre:register-groups-bind ,capture-names
           (,url-regexp (hunchentoot:script-name*))
         ,@body))
     (push (hunchentoot:create-regex-dispatcher ,url-regexp ',name)
           hunchentoot:*dispatch-table*)))

(defun json-resp (return-code body)
  (when return-code
    (setf (hunchentoot:return-code*) return-code))
  (setf (hunchentoot:content-type*) "application/json")
  (jonathan:to-json body))

(define-regexp-route current-game-state-handler ("^/game$")

  (let* ((game-no (service-curr-game-no *service*))
         (move-no 0)
         (game-exc (gethash game-no (service-game-executions *service*)))
         (game (and game-exc (game-execution-game game-exc))))
    (if (null game-exc)
        (json-resp hunchentoot:+HTTP-NOT-FOUND+
                   '(:error "no current games"))
        (json-resp nil
                   (list (libtetris:game-height game) (libtetris:game-width game) move-no game-no)))))


(define-regexp-route game-move-handler ("^/games/([0-9]+)/moves/([0-9]+)$"
                                        (#'parse-integer game-no) (#'parse-integer move-no))
  ;; (setf (hunchentoot:content-type*) "text/plain")
  (let* ((game-exc (gethash game-no (service-game-executions *service*)))
        (moves (and game-exc (game-execution-moves game-exc))))
    (if (null game-exc)
        (json-resp hunchentoot:+HTTP-NOT-FOUND+ '(:error "no such game"))
          (cond
            ((and t (>= move-no (length moves)))
             (json-resp hunchentoot:+HTTP-REQUESTED-RANGE-NOT-SATISFIABLE+
                        '(:error "requested move outside of range of completed game")))
            (t (loop with
                  max-move-catchup-wait-secs = (config-max-move-catchup-wait-secs
                                                (service-config *service*))
                  for i below max-move-catchup-wait-secs
                  as behind = (>= move-no (length moves))
                  while behind
                  do (progn (format t "waiting for game to catch up to from ~D to ~D on game ~D~%"
                                    (length moves) move-no game-no)
                            (sleep 1))
                  finally
                    (if behind
                        (json-resp hunchentoot:+HTTP-SERVICE-UNAVAILABLE+
                                   '(:error "reached timeout catching up to requested move~%" ))
                        (return
                          (json-resp nil
                                     (with-slots (libtetris::shape-code libtetris::rot libtetris::col)
                                         (aref moves move-no)
                                       (list libtetris::shape-code libtetris::rot
                                             libtetris::col)))))))))))

(define-regexp-route game-list-handler ("^/games/?$")
  (json-resp nil
             (loop for game-no being the hash-keys of (service-game-executions *service*)
                collect game-no)))

(push (hunchentoot:create-static-file-dispatcher-and-handler
       "/index.html" "html/tetris.html")
      hunchentoot:*dispatch-table*)

(push (hunchentoot:create-static-file-dispatcher-and-handler
       "/js/tetris_client.js" "js/tetris_client.js")
      hunchentoot:*dispatch-table*)

(push (hunchentoot:create-static-file-dispatcher-and-handler
       "/loading.gif" "loading.gif")
      hunchentoot:*dispatch-table*)

(hunchentoot:define-easy-handler (shapes :uri "/shapes") ()
  (libtetris:serialize-shapes))

(defun game-run (game-exc)
  (loop
     with game = (game-execution-game game-exc)
     with moves = (game-execution-moves game-exc)
     with max-moves = (game-execution-max-moves game-exc)
     for i from 0
     as next-move = (libtetris:game-apply-next-move game)
     while (and next-move (or (null max-moves) (< i max-moves)))
     do (libtetris:game-print game)
     do
       (let ((native (libtetris:my-translate-from-foreign next-move)))
         (progn
           (format t "on move ~D, shape ~D, rot ~D, col ~D~%" i
                   (slot-value native 'libtetris::shape-code)
                   (slot-value native 'libtetris::rot)
                   (slot-value native 'libtetris::col))
           (sleep .5)
           (vector-push-extend native moves)))))

(defun game-create (game-no &optional max-moves)
  (let ((moves (make-array 0 :adjustable t
                           :fill-pointer t
                           :element-type 'libtetris:game-move-native))
        (game (libtetris:game-init libtetris:HEIGHT libtetris:WIDTH libtetris:ai-default-weights)))
    (setf (gethash game-no (service-game-executions *service*))
          (make-game-execution :game game :moves moves :max-moves max-moves
                               ))))

(defun game-create-run (&optional game-no max-moves)
  (let ((game-no (or game-no (incf (service-curr-game-no *service*)))))
    (when (gethash game-no (service-game-executions *service*))
      (error "game ~D exists" game-no))
    (game-run (game-create game-no max-moves))))

(defun game-create-run-thread (game-no &optional max-moves)
  (let* ((game-exc (game-create game-no max-moves)))
          (sb-thread:make-thread 'game-run :arguments (list game-exc)
                                 )))

