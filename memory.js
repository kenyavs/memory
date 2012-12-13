/**
* Adds click event listeners to the "play" and "play again" buttons and starts game when the window loads.
**/
window.onload = function(){
    var container = document.getElementById("container");
    container.addEventListener("click", utilities.delegate, false);
}
//QUESTION: why doesn't jquery ajax module recognize the anonymous version of this function?
function jsoncallback(json){
    var MAX_LENGTH = 6;
    var txt='';
    var data=[];
    //shuffle tweets. fisher yates suffle
    for (var i = json.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = json[i];
        json[i] = json[j];
        json[j] = temp;
    }
    if(json.length>=MAX_LENGTH){
        for(var i=0; i<MAX_LENGTH; i++){
            txt = json[i].text;
            var obj = {text:txt,count:2};
            data.push(obj);
        }
        board.load(data, MAX_LENGTH);
        document.getElementById("username").classList.toggle("hide");
        document.getElementById("board").classList.remove("hide");
        document.getElementById("board").classList.add("show-table");
    }
    else if(json.error==="Not authorized"){
        console.log('This user is private. Choose another username');
    }
    else if(json.errors!==""){
        console.log("This user doesn't exist. Choose another username");
    }
    else{
        //maybe make an error object that routes errors accordingly?
        console.log('Bummer, not enough tweets to play. Choose another username.');
    }
}
var utilities = {
    /**
    *Clears/resets all input elements within the document
    */
    clearInputs:function(){
        var input_elements = document.getElementsByTagName("input");
        for(var i = 0; i<input_elements.length; i++){
            input_elements[i].value = '';
        }
    },
    /**
    *Implements event delegation for clicks within the container...the game board
    */
    delegate:function(e){
        var target = e ? e.target : window.event.srcElement; //for IE
        //play button clicked
        if(target.parentNode.className==="username" && target.className==="button"){
            utilities.validate_input();
        }//play again button clicked
        else if(target.parentNode.className==="play-again" && target.className==="button"){
            utilities.clearInputs();
            location.reload();
        }//div cell...essentially the board has been clicked
        else if(target.className==="div-cell on"){
            if(board.click_num===2){
                board.compareClicks();
                //pause before resetting clicks...
                setTimeout(function(){
                    board.resetClicks();
                    //if number of matches found == MAX_LENGTH, the game has ended, ask to reload board...
                    if(board.number_of_matches===board.max_length){
                        document.getElementById("username").classList.toggle("z-index");
                        document.getElementById("play-again").classList.toggle("hide");
                    }
                }, 500);
            }
        }
    },
    /**
        *Makes a jsonp ajax call to twitter's api for the username provided
    */
    executeAjaxHandler: function(username){
        var url = "https://api.twitter.com/1/statuses/user_timeline.json?screen_name="+username+"&count=20";
        $.ajax({
                  url: url,
                  dataType: "jsonp",
                  jsonp : "callback",
                  jsonpCallback: "jsoncallback"
            });
    },
    /**
    *Checks for valid username input. Throws an error if invalid, loads board otherwise.
    */
    validate_input: function(){
        //no need for new object
        var msg_obj = new Message();
        //if there's a username make ajax request
        try{
            var username = document.getElementById("username").getElementsByTagName("input")[0].value;
            if(username==''){
                throw new UserException("Must enter username to play.");
            }
            else{
                //document.getElementById("message-drawer").style.display = 'none';
                msg_obj.getMessageDrawer().classList.add("hide");
                utilities.executeAjaxHandler(username);
            }
        }
        catch(err){
            console.log(err.name);
            /*HERE*/msg_obj.getMessageDrawer().getElementsByClassName("message-text")[0];
            /*HERE*/document.getElementsByClassName("message-text")[0].innerHTML = err.msg;
            msg_obj.getMessageDrawer().classList.remove(err.class_name);//QUESTION: is this line absolutely unecessary? is it better to do the line below? i added this line to avoid accessing the dom so much...
        }
    }
}
var board = {
    click_num:0,
    card_count:0,
    selectedCards:[],
    cards:[],
    BOARD_LENGTH:4,
    BOARD_WIDTH:3,
    number_of_matches:0,
    /**
    *Loads the game board with data/returned tweets.
    */
    load : function (data, MAX_LENGTH){
        this.max_length = MAX_LENGTH;
        var random_num = 0;
        var filled_cell = true;
        this.game_board = document.getElementById("board");//would be better to actually access this by class name?
        for(var i = 0; i<this.BOARD_LENGTH; i++){
            var row = document.createElement("div");
            row.className = "div-row";
            this.game_board.appendChild(row);
            for(var j = 0; j<this.BOARD_WIDTH; j++){
                //loop until a cell is filled with an item from the data array
                while(filled_cell){
                /*if the count value of the randomly generated index for data is greater than 0, fill the board with that info
                and decrease by one. data used to fill a cell can only be used twice.*/
                    random_num = board.getRandomNum();
                    if(data[random_num]["count"]>0){
                        var new_card = new Card(data[random_num]["text"]);
                        row.appendChild(new_card.getCardMarkup());
                        this.card_count++;
                        this.cards.push(new_card);
                        data[random_num]["count"] = data[random_num]["count"]-1;
                        filled_cell = false;
                    }
                }
                filled_cell = true;
            }
        }
    },
    /**
    *Returns a randomly generated number btwn the values of 0 and the length of the data array.
    */
    getRandomNum: function (){
        return Math.floor((Math.random()*(this.max_length)));
    },
    /**
    *Resets the number of "board" clicks to zero, re-initializes selectedCards value and adjust css
    */
    resetClicks:function(){
        for(var i = 0; i<this.selectedCards.length; i++){
            //gray out cell and disable click
            this.selectedCards[i].classList.remove("on");
            this.selectedCards[i].classList.add("off");
        }
        this.click_num = 0;
        this.selectedCards = [];
    },
    /**
    *Increment board click value by one.
    */
    incrementClicks: function(){
        this.click_num++;
    },
    /**
    *Add the clicked element to the board's current_click array.
    */
    recordClick: function(e){
        this.selectedCards.push(e.target);
    },
    /**
    *Compare the values/text of the elements within the board's selectedCards array. If equal, remove card from board, otherwise
    *add the click event listener back to the elements.
    */
    compareClicks: function(){
        //this should be changed to compare something like "match_id"
        if(this.selectedCards[0].innerHTML===this.selectedCards[1].innerHTML){
            console.log("It's a match!");
            setTimeout(function(){
                board.removeCard();
                    }, 500);
            this.number_of_matches++;
        }
        else{
            for(var i = 0; i<this.selectedCards.length; i++){
                var card = this.selectedCards[i];
                //add the listener back to the card
                card.addEventListener("click", board.cards[card.id].listener, false);
                // QUESTION: is there anyway to obtain the object that the markup is attached to?
            }
            console.log("Welp :/");
        }
    },
    /**
    *Manipulates css to simulate a "removed" card
    */
    removeCard: function(){
        for(var i = 0; i<this.selectedCards.length; i++){
            //gray out cell and disable click/remove click event listener
            this.selectedCards[i].classList.remove("on");
            this.selectedCards[i].classList.add("removed");
        }
    }
}
var UserException = function(msg){
    this.msg = msg;
    this.name = "UserException";
    this.class_name = "hide";
}
var Card = function(text) {
        var div = document.createElement("div");//should div have this prepended on it?
        div.innerHTML = text;
        div.classList.add("div-cell");
        div.classList.add("off");
        div.id = board.card_count;
        this.markup = div;
        this.card_name = name;
        var self = this;
        var listener = function (e) {
            div.classList.remove("off");
            div.classList.add("on");
            board.incrementClicks();
            board.recordClick(e);
            this.removeEventListener("click", listener, false);
        };
        this.listener = listener;
        //TODO: understand the differences btwn the above code and below code
        /*this.listener = function (e) {
          board.incrementClicks();
          board.recordClick(text, e);
          this.removeEventListener("click", this.listener, false);
        };*/
        this.markup.addEventListener("click", this.listener, false);
}
Card.prototype = {
    getCardMarkup: function(){
        return this.markup
    }
}
var Message = function(){
    var message_drawer = document.getElementById("message-drawer");
    this.message_drawer = message_drawer;
}
Message.prototype = {
    getMessageDrawer:function(){
        return this.message_drawer;
    }
}