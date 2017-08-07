
// The automatically-created socket is exposed as io.socket.
// Use .on() to subscribe to the 'user' event on the client.
// This event is sent by the Sails "create", "update",
// "delete", "add" and "remove" blueprints to any socket that
// is subscribed to one or more User model instances.
io.socket.on('user', cometMessageReceivedFromServer );
// Using .get('/user') will retrieve a list of current User models,
// subscribe this socket to those models, AND subscribe this socket
// to notifications about new User models when they are created.
io.socket.get('/user/subscribe', function gotResponse(body, response) {
  console.log(body);
  console.log('Status: ' +response);
})

// This function routes the message based upon the model which issued it
function cometMessageReceivedFromServer(message) {

  console.log("Here's the message: ", message);

  // Okay, I need to route this message to the appropriate place.

  // This message has to do with the User Model
  
    var userId = message.id
    updateUserInDom(userId, message);

    

    if(message.verb !== "destroyed") {
      displayFlashActivity(message);  
    } 
    
}

function displayFlashActivity(message) {
  
  $(".navbar").after("<div class='alert alert-success'>" + message.data.name + message.data.action + "</div>");
  $(".alert").fadeOut(5000);
}

function updateUserInDom(userId, message) {

  // What page am I on?
  var page = document.location.pathname;
console.log(page);
  // Strip trailing slash if we've got one
  page = page.replace(/(\/)$/, '');
  console.log(page);
  // Route to the appropriate user update handler based on which page you're on
  switch (page) {

    // If we're on the User Administration Page (a.k.a. user index)
    case '/user':

      // This is a message coming from publishUpdate
      if (message.verb === 'updated') {
        UserIndexPage.updateUser(userId, message);
      }

      // This is a message coming from publishCreate
      if(message.verb === 'created') {
        UserIndexPage.addUser(message);
      }
      // This is a message coming publishDestroy
      if(message.verb === 'destroyed') {
        UserIndexPage.destroyUser(userId);
      }
      break;
  }
}

/////////////////////////////////////////////////
// User index page DOM manipulation logic
// (i.e. backbone-style view)
/////////////////////////////////////////////////
var UserIndexPage = {

  // Update the User, in this case their login status
  updateUser: function(id, message) {
    if (message.data.loggedIn) {
      var $userRow = $('tr[data-id="' + id + '"] td img').first();
      $userRow.attr('src', "/images/icon-online.png");
    } else {
      var $userRow = $('tr[data-id="' + id + '"] td img').first();
      $userRow.attr('src', "/images/icon-offline.png");
    }
  },

  // Add a user to the list of users in the User Administration Page
  addUser: function(user) {

  // obj is going to encompass both the new user data as well as the _csrf info from 
  // the layout.ejs file
  var obj = {
    user: user.data,
    _csrf: window.overlord.csrf || ''
  };

  var template =  _.template('<tr data-id="<%- user.id %>" data-model="user">'+
      '<% if (user.online) { %>'+
        '<td><img src="./images/icon-online.png"></td>'+
      '<% } else { %>'+
        '<td> <img src="./images/icon-offline.png"></td>'+
      '<% } %>'+
      '<td><%- user.id %></td>'+
      '<td><%- user.name %></td>'+
      '<td><%- user.title %></td>'+
      '<td><%- user.email %></td>'+
      '<% if (user.admin) { %>'+
        '<td> <img src="/images/admin.png"></td>'+
      '<% } else { %>'+
        '<td> <img src="/images/pawn.png"></td>'+
      '<% } %>' +
      '<td><a href="/user/show/<%- user.id %>" class="btn btn-small btn-primary">Show</a></td>'+
      '<td><a href="/user/edit/<%- user.id %>" class="btn btn-small btn-warning">Edit</a></td>'+
      '<td><form action="/user/destroy/<%- user.id %>" method="POST">'+
        '<input type="hidden" name="_method" value="delete"/>'+
        '<input type="submit" class="btn btn-sm btn-danger" value="Delete"/>'+
        '<input type="hidden" class="_csrf" name="_csrf" value="<%- _csrf %>" />'+
      '</form></td>'+
'</tr> ');
     finalTemplate = template(obj); 

  // Add the template to the bottom of the User Administration Page
    $( 'tr:last' ).after(finalTemplate);
  },

  // Remove the user from the User Administration Page
  destroyUser: function(id) {
    $('tr[data-id="' + id + '"]').remove();
  }
}