 /*
        @licstart  The following is the entire license notice for the
        JavaScript code in this page.

        Copyright (C) 2014  Ernesto Alfonso

        The JavaScript code in this page is free software: you can
        redistribute it and/or modify it under the terms of the GNU
        General Public License (GNU GPL) as published by the Free Software
        Foundation, either version 3 of the License, or (at your option)
        any later version.  The code is distributed WITHOUT ANY WARRANTY;
        without even the implied warranty of MERCHANTABILITY or FITNESS
        FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

        As additional permission under GNU GPL version 3 section 7, you
        may distribute non-source (e.g., minimized or compacted) forms of
        that code without the copy of the GNU GPL normally required by
        section 4, provided you include this license notice and a URL
        through which recipients can access the Corresponding Source.


        @licend  The above is the entire license notice
        for the JavaScript code in this page.
        */

// var SERVER = "http://root.erjoalgo.com/"
// var SERVER = "http://www.andrew.cmu.edu/user/ealfonso/";
// var SERVER = "http://45.55.140.195/";
// var SERVER = "http://erjoalgo.com/"
var SERVER = ""
var square = "30";
var cell_grid = [];
var retry_timeout = 500;
// function hola{return 1;}
var loading;

function hide_show_loading ( show )
{
    // loading.style=show?"":;
    if (show)
    {
	loading.height = "400";
	loading.width = "550";
	loading.style="";
    }
    else
    {
	loading.height = "0";
	loading.width = "0";
	loading.style="visibility:hidden";

    }
}
function table_create (width, height) {

    //body reference
    // debugger;
    var body = document.getElementsByTagName("body")[0];

    loading = document.createElement("img");
    // loading.src = "http://root.erjoalgo.com/loading.gif";
    loading.src = SERVER+"/loading.gif";

    hide_show_loading(false);
    body.appendChild(loading);


    // create elements <table> and a <tbody>
    var tbl     = document.createElement("table");
    tbl.class = "table";
    // tbl.style.border = "1px solid red"
    var tblBody = document.createElement("tbody");
    // tblBody.border = "1";
    // tblBody.style.border="1px solid red";
    // tblBody.style.borderWidth="1px";

    // var tblBody = tbl;
    // cells creation
    for (var j = 0; j < height; j++) {
        // table row creation
	cell_row = [];
	cell_grid.push(cell_row);
        var row = document.createElement("tr");
        for (var i = 0; i < width; i++) {
            // create element <td> and text node
            //Make text node the contents of <td> element
            // put <td> at end of the table row
            var cell = document.createElement("td");
	    cell_row.push(cell);

	    cell.width = square;
	    cell.height = square;
	    cell.bgColor = blank;
	    cell.style.border = "1px solid #000"

            // var cellText = document.createTextNode("cell is row "+j+", column "+i);
            var cellText = document.createTextNode("");
            cell.appendChild(cellText);
            row.appendChild(cell);
        }

        //row added to end of table body
        // tblBody.appendChild(row);
        tblBody.appendChild(row);
    }
    // append the <tbody> inside the <table>
    tbl.appendChild(tblBody);
    // put <table> in the <body>
    body.appendChild(tbl);
    // tbl border attribute to
    tbl.setAttribute("border", "2");
    completed = true;

}
var consec_failed_mills = 0;
var server_timeout = 20000;
// var timer_delay = 200;
var timer_delay = 90;
var server_moves_ahead = [];




function assert(condition, message) {

    // todo: upload stack trace

    if (!condition)
    {
	message = message || "Assertion failed"
        alert(message);
	debugger;
        throw message;
    }
}
function stackTrace() {
    var err = new Error();
    return err.stack;
}

function min (a, b) {


    return a<b?a:b;
}

function server_request ( requestcode, response_hanlder )
{

    assert(requestcode!=null && response_hanlder != null);

    var xhr = new XMLHttpRequest();
    // xhr.open('get', 'http://root.erjoalgo.com/tetris_updater/send_ajax_data.php');
    // xhr.open('get', "http://root.erjoalgo.com/tetris_updater/send_ajax_data.php?tcode="+requestcode);
    // xhr.open('get', "http://root.erjoalgo.com/tetris.uwsgi?"+requestcode);
    //console.log( "making server request" );
    xhr.open('get', SERVER+requestcode);
    // Track the state changes of the request
    xhr.onreadystatechange = function(){
	// Ready state 4 means the request is done
	if(xhr.readyState === 4){
            // 200 is a successful return
            if(xhr.status === 200)
	    {
		var response = null;
		// alert(xhr.responseText); // 'This is the returned text.'
		// var array = new JSONArray(xhr.responseText);
		try{
		    response = eval(xhr.responseText+";");
		}
		catch (err)
		{
		    if (xhr.responseText=="game over :(")
			{
			    game_over_fun();
			    return ;
			}
		    console.log("failed to parse request: "+xhr.responseText);
		    // alert("error parsing response from server");
		    consec_failed_mills+=retry_timeout;

		    if (consec_failed_mills>server_timeout)
		    {
			alert("server seems unresponsive. try again later")
		    }
		    else
		    {
			setTimeout(function(){server_request(requestcode, response_handler)},retry_timeout);
		    }
		    return ;
		}
		assert(! (response==null), " error from server");
		consec_failed_mills = 0;
		response_hanlder(response);
		// alert(array);
		// return array;
            }
/*	    else{
		alert('Error: '+xhr.status); // An error occurred during the request
            }*/

	}
    }
    // Send the request to send-ajax-data.php
    xhr.send(null);
}


//y inverted



/*        def invert_y (model):
             maxy=max(map(lambda xy:xy[1], model))
             return [ [xy[0],maxy-xy[1]] for xy in model]*/

//var heights = [[4, 1], [3, 2, 3, 2], [2, 3, 2, 3], [3, 2], [3, 2], [2], [2, 3, 2, 3]];
// [[max(defaultShapeSet[i].topCrust[r], key = lambda xy:xy[1])[1]+1 for r in xrange(len(defaultShapeSet[i].topCrust))] for i in xrange(len(defaultShapeSet))]

//no need to recreate rotation code I have on the server

var colors = function(){return {
    'BLUE':"#0000f0",
    'BLACK':"#000000",
    'WHITE':"#ffffff",
    'GREEN':3
    }}();

var shape_color = [colors.BLUE, colors.BLUE, colors.BLUE, colors.BLUE, colors.BLUE, colors.BLUE, colors.BLUE];
var blank = colors.WHITE;

var move_queue = [];


var mrxy = [null, null, null, null];//model, rotate state, x distance from left, y from top
var answer_rx = null;
var paused_p = false;
var game_over = false;
var move_no = null;
var game_no = null;

var grid = {
    relief:null,
    width:null,
    height:null,
    need_clear:[],
    needs_clear:false,
    rowcounts:null,
    grid:null
};

var server_moves_ahead = {
    i:0, max_i:0, q:[]};

/*function virtual_iterate ()
{
    // var m, r, x, y, w, h = mrxy[0], mrxy[1], mrxy[2], mrxy[3], grid.wh[0], grid.wh[1];
    var m = mrxy[0], r = mrxy[1], x = mrxy[2], y = mrxy[3];
    var shape = shapes[m][r];
    var xy = [];
    for (var coord in shape)
	{
	    xy[0] = coord[0]+x;
	    xy[1] = coord[1]+y;
	    yield xy;
	}
}*/

function virtual_iterate ()
{

    // var m, r, x, y, w, h = mrxy[0], mrxy[1], mrxy[2], mrxy[3], grid.wh[0], grid.wh[1];
    var m = mrxy[0], r = mrxy[1], x = mrxy[2], y = mrxy[3];
    ////debugger;
    // assert(!(m==null), " assertion failed at 244 ");
    var shape = shapes[m][r];
    var xy = [];
    // for (var coord in shape)
    var coords = [];
    for (var i = 0; i<shape.length;i++)
    {
	// xy[0] = shape[i][0]+x;
	// xy[1] = shape[i][1]+y;
	coords.push([shape[i][0]+x, shape[i][1]+y]);
	// yield xy;
    }

    return coords;
}
function paint_to (color, no_overwrite)
{


    // for (var xy in virtual_iterate())
    var coords = virtual_iterate();
    var xy;
    if (no_overwrite)
    {
	for (var i = 0;i< coords.length; i++)
	{
	    xy = coords[i];
	    if (cell_grid[xy[1]][xy[0]].bgColor!=blank)
	    {
		//debugger;
		game_over = true;

		return false;
	    }

	}
    }


    for (var i = 0;i< coords.length; i++)
    {
	xy = coords[i];
	cell_grid[xy[1]][xy[0]].bgColor = color;
	cell_grid[xy[1]][xy[0]].bgColor = color;
    }

    return true;
}

function move_tetro ( move_fun )
{


    paint_to(blank);
    move_fun();
    var succ = paint_to(colors.BLUE, true);//undo last move and repaint if this doesn't succeed
    if (!succ)
    {
	move_fun(true);//undo
	paint_to(colors.BLUE);
    }

}
function add_tetro (  )
{
    //console.log( "adding tetro" );

    paint_to(colors.BLUE);
}


function left ( undo ) {


    !undo?mrxy[2]--:mrxy[2]++;
}
function right ( undo ) {


    !undo?mrxy[2]++:mrxy[2]--;
}
function rotcw ( undo ) {


    !undo?mrxy[1]++:mrxy[1]--;
    mrxy[1]%=4;
}
function rotccw ( undo ) {


    !undo?mrxy[1]--:mrxy[1]++;
}
function down ( undo ) {


    !undo?mrxy[3]++:mrxy[3]--;
}


function get_drop_distance (  )
{
    var bot_crust = bot_crusts[mrxy[0]][mrxy[1]];

    // var height = heights[mrxy[0]][mrxy[1]];


    var dist, min_dist = grid.height;
    var x = mrxy[2];
    var y = mrxy[3];

    // for (xy in bot_crust)
    for (var i = 0, relief_y; i<bot_crust.length; i++)
    {
	xy = bot_crust[i];
	relief_y = grid.relief[xy[0] +x];
	dist = relief_y - xy[1];
	if (dist<min_dist)
	{
	    min_dist = dist;
	    new_y = relief_y;
	}
    }

    var drop_dist = min_dist-1-y;
    if (drop_dist<0)
    {

	////debugger
;
    }

    return drop_dist;
}
function drop (  )
{


    //assert(answer_rx[0]==mrxy[1] && answer_rx[1]==mrxy[2], " assertion failed at 380 ");


    var drop_distance  = get_drop_distance();
    if (drop_distance<0)
	{
	    //debugger;
	    game_over = true;
	    return ;
	}

    mrxy[3] += drop_distance;
    var y = mrxy[3];
    var x = mrxy[2];

    var top_crust = top_crusts[mrxy[0]][mrxy[1]];
    for (var i = 0, xy = null; i<top_crust.length; i++)
    {
	xy = top_crust[i];
	grid.relief[xy[0] + x] = xy[1]+y;


    }

    var coords = virtual_iterate();
    for (var i = 0;i< coords.length; i++)
	{
	    xy = coords[i];

	    if (++grid.rowcounts[xy[1]]==grid.width)
		{
		    grid.needs_clear = true;
		    grid.need_clear.push(xy[1]);
		}
	    grid.grid[xy[1]][xy[0]] = colors.BLUE;
	}
}

function maybe_clear (  )
{
    //console.log( "maybe clearing..." );
    if (move_no>=5)
    {
	// //debugger;
    }

    if (grid.needs_clear)
    {
	clear_lines();
    }
}

function sum ( list )
{

    var sm = 0;
    for (var i = 0; i<list.length;i++ )
	{
	    if (!(list[i]==blank))
	    {
		sm++;
	    }
	}
    return sm;
}
function list_min ( list )
{

    var min = null;
    for (var i = 0; i<list.length;i++ )
    {
	if (min==null || list[i]<min)
	    min = list[i];
    }
    return min;
}



var cmpNum = function(a,b){return a-b}

function clear_lines (  )
{

    // grid.last_cleared = grid.need_clear.length;
    assert(grid.need_clear.length>0,  " assertion failed at 464 ");
    if (grid.need_clear.length>0)	{
	// cmpNum is necessary, otherwise sort is lexicographic, eg 10<9
	// would be nice to make need_clear a pqueue
	grid.need_clear.sort (cmpNum);//smallest to largest
    }
    const YMIN = grid.need_clear[grid.need_clear.length-1];
    const YMAX = list_min(grid.relief);//the tallest row is 0. ymax should be as small as possible
    var y = YMIN;
    // grid.need_clear.reverse ();
    var nextNonFull = y-1;//not necessarily non-full here
    var cleared = [];

    while (nextNonFull >= YMAX)
    {
	while (grid.rowcounts[nextNonFull] == grid.width)
	    nextNonFull-=1;
        if (nextNonFull < YMAX)
            break;
	//nextNonFull should be non-full now
        // assert(grid.grid.length == grid.height,  " assertion failed at 481 ");
        if (grid.rowcounts[y]==grid.width)
	{
            assert(grid.need_clear[grid.need_clear.length-1] == y, " assertion failed at 485 ");
            grid.need_clear.pop ();
            cleared.push(grid.grid[y]);
	}
	//copy nextNonFull row into y-th row
        grid.grid[y] = grid.grid[nextNonFull];
        grid.rowcounts[y] = grid.rowcounts[nextNonFull];
        y-=1;
        nextNonFull -=1;
	}

    while (grid.need_clear.length>0)
        cleared.push(grid.grid[grid.need_clear.pop ()]);

    // //debugger;

    while (y>=YMAX)
    {
        //assert((cleared.length>0  && sum (cleared[0])==grid.width )  || sum (grid.grid[y])==grid.width,  " assertion failed at 510 ");
        assert(cleared.length> 0,  " assertion failed at 519 ");
        grid.grid[y] = cleared.pop ();
        grid.rowcounts[y] = 0;
        for (var i = 0; i<grid.width;i++)
            grid.grid[y][i] = blank;
        y-=1;
    }
    //        map (partial (operator.__setitem__, a=grid.relief));

    assert(grid.need_clear.length==0,  " assertion failed at 536 ");
    assert(cleared.length==0,  " assertion failed at 537. game_no: "+game_no);//this is failing

    for (var i = 0; i<grid.width; i++)
    {
        var relief = grid.relief[i];
        while (relief<grid.height && grid.grid[relief][i] ==blank)
	    relief+=1;
        grid.relief[i] = relief;
    }

    // assert(grid.consistency (), "failed assertion at line 419 ");
    grid.needs_clear = false;
    // repaint_rows(ymin, YMAX);
    repaint_rows(YMAX, YMIN+1);
}
function repaint_rows ( ymin, ymax )
{

    for (;ymin<ymax;ymin++)
	{
	    for (var x = 0; x<grid.width; x++)
		{
		    cell_grid[ymin][x].bgColor = grid.grid[ymin][x];
		}
	}
}



function fetch ( response )
{

    //console.log( "fetching..." );
    if (!(server_moves_ahead.i<server_moves_ahead.max_i) )
    {
	// //debugger;
	if (response!=null)
	{
	    assert(server_moves_ahead.i==server_moves_ahead.max_i,  " assertion failed at 566 ");
	    assert(!(response.length%3),  " assertion failed at 567 ");

	    var to = min(server_moves_ahead.q.length, response.length);
	    for (var i = 0; i<to; i++)
	    {server_moves_ahead.q[i] = response[i];}
	    for (var i = server_moves_ahead.q.length; i<response.length; i++)
	    {server_moves_ahead.q.push(response[i]);}

	    server_moves_ahead.max_i = response.length;
	    server_moves_ahead.i = 0;

	    assert(server_moves_ahead.i + 2 <server_moves_ahead.max_i,  " assertion failed at 578 ");

	}
	else
	{
	    assert(server_moves_ahead.i==server_moves_ahead.max_i,  " assertion failed at 583 ");
	    //debugger;
	    //console.log( "requesting moves from server" );
            var uri = "/games/"+game_no+"/moves/"+move_no;
            server_request(uri, fetch); //model, rotation, x
	    return;
	}
    }

    assert(server_moves_ahead.i + 2 <server_moves_ahead.max_i, " assertion failed at 590 ");

    // assert(first_move, "failed assertion at line 459 ");
    var first_move = null;
    first_move = [null, null, null];
    first_move[0] = server_moves_ahead.q[server_moves_ahead.i++];
    first_move[1] = server_moves_ahead.q[server_moves_ahead.i++];
    first_move[2] = server_moves_ahead.q[server_moves_ahead.i++];
    ////debugger;


    mrxy[0] = first_move[0], mrxy[1] = 0, mrxy[2] = grid.width/2-1, mrxy[3] = 0;
    answer_rx[0] = first_move[1], answer_rx[1] = first_move[2];
    move_no++;


    timer();
}

function init ( response )
{
    if (response==null)
	{
	    server_request("/games/0", init);
	    return;
	}

    // response = [[0, 18], [0, 17], [1, 18], [1,17], [1,16], 10, 19, 0];
    // response = [];
    var miny = grid.height;

    game_no = response.pop()
    console.log("game_no is: " +game_no);

    move_no = response.pop();
    move_no = 0;
    grid.width = response.pop();
    grid.height = response.pop();
    grid.rowcounts = []
    grid.grid = [];
    grid.relief = [];
    answer_rx = [null, null];

    table_create(grid.width, grid.height);//delete previous table

    for (var i = 0; i<grid.height;i++)
    {
	grid.rowcounts.push(0);
	var row = [];
	grid.grid.push(row);
	for (var ii = 0; ii<grid.height;ii++)
	    row.push(blank);
    }
    for (var i = 0; i<grid.width;i++)
    {
	grid.relief.push(grid.height);
    }

    // for (var xy in response)
    for (var i = 0;i<response.length;i++)
    {
        continue;
        xy = response[i];
        x = xy%grid.width;
        y = Math.floor(xy/grid.width);
        y = grid.height-1-y;

	grid.grid[y][x] = colors.BLUE;
	cell_grid[y][x].bgColor = colors.BLUE;
	if (y<miny)
	    miny = y;
	if (y<grid.relief[x])
	{
	    grid.relief[x] = y;
	}
	grid.rowcounts[y]++;
    }
    repaint_rows(0, miny);
    timer();
}

var top_crusts = [];
var bot_crusts = [];
var shapes = [];

function init_shapes ( response )
{
    if (response == null)    {
        server_request("shapes", init_shapes)
    }else     {
        for (var i = 0; i<response.length; i++)    {
            var shape = response[i];
            var rots = shape.rotation_configurations;
            for (var r = 0; r<rots.length; r++)    {
                var rot_h = shape.rot_wh[r][1];
                var zero_seen = false;
                var rot = rots[r];
                for (var b = 0; b<rot.length; b++)    {
                    rot[b][1] *= -1;
                    rot[b][1] += rot_h-1;
                    assert(rot[b][1]>=0);
                    zero_seen = zero_seen || rot[b][1] == 0;
                }
                assert(zero_seen);

                CRUST_NAMES = ["top", "bot", "left", "right"];
                for (var c = 0; c<CRUST_NAMES.length; c++)    {
                    var crust = shape.crust_configurations[CRUST_NAMES[c]][r];
                    for (var b = 0; b<crust.length; b++)    {
                        var cr = crust[b];
                        cr[1]*=-1;
                        cr[1]+=rot_h-1;
                        assert(cr[1]>=0);
                    }
                }
            }
            shapes.push(shape.rotation_configurations);
            assert(shape.id == i);
            top_crusts.push(shape.crust_configurations.top);
            bot_crusts.push(shape.crust_configurations.bot);
        }
        timer();
    }
}


function plan (  )
{
    //console.log( "planning..." );
    for (var r  = mrxy[1], direc = mrxy[1]<answer_rx[0]?1:-1; r!=answer_rx[0]; r+=direc)
	{
	    move_queue.push(direc>0?rotcw:rotcw);
	}
    // move_queue.push(direc>0?moves.ROTCW:moves.ROTCW);
    for (var x  = mrxy[2], direc = mrxy[2]<answer_rx[1]?1:-1; x!=answer_rx[1]; x+=direc)
	{
	    move_queue.push(direc>0?right:left);
	}
    move_queue.push(drop);
    move_queue.push(maybe_clear);
    move_queue.push(fetch);
    move_queue.push(add_tetro);
    move_queue.push(plan);
}

function pause_toggle (  )
{
console.log("calling pause_toggle");//autogen function logger


    paused_p = !pause_p;
}

function game_over_fun (  )
{

    game_over = true;
    //debugger;
    alert("game over!");
    console.log("game over");
}

function timer (  )
{
    ////debugger;

    if (paused_p)
    {
	//unpause must bring timer back to life
	return ;
    }
    // alert("timer executing");
    if (move_queue.length>0)
    {
	var move = move_queue.shift();
	//debugger;

	if (move.name in paint_moves)
	{
	    move_tetro(move);
	    if (move==drop && grid.needs_clear)
	    {
		;//con
	    }

	}
	else
	{
	    move();
	}
	if (game_over)
	{
	    //debugger;

	    game_over_fun();
	}
	else if (!(move.name in two_step_moves))
	{
	    if ((move.name in no_delay_moves ))
		{
		    timer();
		}

	    else
	    {
		setTimeout(timer,timer_delay);
	    }

	}
	//otherwise two-step-move must bring timer back to life

    }
    else
    {
	alert("no more pending moves");
    }
}

/*moves = function() {return {
    'INIT' : init,
    'FETCH' : fetch,
    'ROTCW'	: rotcw,
    'ROTCCW'	: rotccw,
    'LEFT'	: left,
    'RIGHT'	: right,
    'DROP'	: drop,
    'DOWN'	: down,
    'CLEARLINES'	: clear_lines,
    'MAYBECLEAR'	: maybe_clear,
    'PAUSE'	: pause_toggle,
    'PLAN'	: plan,
    'ADD_TETRO'	: add_tetro,
}} ();*/


/*paint_moves = function() {return {
    'ROTCW'	: rotcw,
    'ROTCCW'	: rotccw,
    'LEFT'	: left,
    'RIGHT'	: right,
    'DROP'	: drop,
    'DOWN'	: down,
}} ();*/
/*paint_moves = {"rotcw":true, "rotccw":true, "drop":true, "left":true, "right":true, "down":true};
two_step_moves = {"fetch":true, "init":true};*/

paint_moves = {rotcw:true, rotccw:true, drop:true, left:true, right:true, down:true};
two_step_moves = {fetch:true, init:true, init_shapes:true};
no_delay_moves = {fetch:true, init:true, plan:true};

/*unfortunate hack for IE, in which function.name doesn't work:*/
init.name = "init";
fetch.name = "fetch";
rotcw.name = "rotcw";
rotccw.name = "rotccw";
left.name = "left";
right.name = "right";
drop.name = "drop";
down.name = "down";
init_shapes.name = "init_shapes";
clear_lines.name = "clear_lines";
maybe_clear.name = "maybe_clear";
pause_toggle.name = "pause_toggle";
plan.name = "plan";
add_tetro.name = "add_tetro";




// server_request(-1);
move_queue.push(init);
move_queue.push(init_shapes);
move_queue.push(fetch);
move_queue.push(add_tetro);
move_queue.push(plan);

// alert("hola");
console.log("hola");

// debugger;

timer();
// init([19, 10, 0]);
