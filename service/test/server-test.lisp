(defpackage #:server-test
  ;; (:use :cl :lisp-unit)
  (:use :cl :stefil)
  (:export))


(in-package #:server-test)

(declaim (optimize (debug 3) (speed 0)))

(defvar test-game-no 5)
(defvar max-no-moves 3)
(defparameter test-service-config
  (server:make-config
   :port 4243
   ;; shapes-file
   ;; seed
   ;; grid-dimensions
   :max-move-catchup-wait-secs 3))

(defparameter base-url (format nil "http://localhost:~D"
                               (server::config-port test-service-config)))

(defvar *test-service* nil)


;; (stefil:in-root-suite)
;; (setf (find-test 'my-test) nil)

(stefil:defsuite* test-handlers)

(defun init ()
  (when *test-service*
    (server:service-stop *test-service*))
  (setf *test-service*
        (server:service-start test-service-config))
  (server:game-create-run test-game-no max-no-moves)
  (setf (server::service-curr-game-no *test-service*) test-game-no);;TODO
  )

;; https://sites.google.com/site/sabraonthehill/home/json-libraries
;; hack to return json as a string
(let ((application-json (cons "application" "json")))
  (unless (member application-json drakma:*text-content-types* :test 'equal)
    (push application-json drakma:*text-content-types*)))

;; https://www.cliki.net/WITH-UNIQUE-NAMES
(defmacro with-unique-names ((&rest bindings) &body body)
  `(let ,(mapcar #'(lambda (binding)
                     (destructuring-bind (var prefix)
                         (if (consp binding) binding (list binding binding))
                       `(,var (gensym ,(string prefix)))))
                 bindings)
     ,@body))

(defmacro req (uri &rest args)
  (with-unique-names (resp parsed)
    `(let* ((,resp (drakma:http-request (concatenate 'string base-url ,uri) ,@args))
           (,parsed (jonathan:parse ,resp)))
       (format t "~A => ~A~%" ,uri ,parsed)
       ,parsed
       )))


(stefil:deftest test-games nil
  (let ((gameno-list (req "/games")))
    (stefil:is (equal 1 (length gameno-list)))
    (stefil:is (equal test-game-no (nth 0 gameno-list)))))

(stefil:deftest test-game-status nil
  (let ((game-status (req "/game")))
    (stefil:is (equal 4 (length game-status)))
    ;; (list (libtetris:game-height game) (libtetris:game-width game) move-no game-no)
    (stefil:is (equal libtetris:HEIGHT (nth 0 game-status)))
    (stefil:is (equal libtetris:WIDTH (nth 1 game-status)))
    (stefil:is (equal 0 (nth 2 game-status)))
    (stefil:is (equal test-game-no (nth 3 game-status)))
    ))

(stefil:deftest test-game-move-success nil
  (let ((game-move (req (format nil "/games/~D/moves/~D" test-game-no 0))))
    (stefil:is (equal 3 (length game-move)))
    (stefil:is (loop for v in game-move always (>= v 0)))
    (stefil:is (< (nth 0 game-move) libtetris:SHAPE-COUNT))
    (stefil:is (< (nth 1 game-move) 4))
    (stefil:is (< (nth 2 game-move) libtetris:WIDTH))
    ))

(stefil:deftest test-game-move-timeout nil
  (multiple-value-bind (resp return-code)
      (drakma:http-request (format nil "~A/games/~D/moves/~D"
                                   base-url test-game-no max-no-moves))
    (declare (ignore resp))
    (stefil:is (equal return-code hunchentoot:+HTTP-SERVICE-UNAVAILABLE+))))

(init)
(test-handlers)

;; (run-tests :all)
