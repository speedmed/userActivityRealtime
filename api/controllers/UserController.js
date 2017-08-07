/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	'new': function(req, res){
		
		res.view();
	},
	
	create: function(req, res, next){

		var userObj = {
			name: req.param('name'), 
			title: req.param('title'), 
			email: req.param('email'), 
			password: req.param('password'), 
			confirmation: req.param('confirmation')}
		//Create user with the params sent from signup form --> new.ejs
		User.create( userObj, function userCreated(err, user){

			//if there's an error
			if(err) {

				console.log(err);
				req.session.flash = {
					err: err
				}

				//redirect back to signup page
				return res.redirect('/user/new');
			};

			//after successfully creating the user log in the user and redirect to the show action
			req.session.authenticated = true;
			req.session.User = user;

			

			//Change status to online
			user.online = true;
			user.save(function(err) {
				if(err) return next(err);
			})

			User.publishCreate(_.omit(user, 'encryptedPassword'), req );
			res.redirect('user/show/' + user.id);
			//Ep1 to Ep6 res.json(user);
			
			
		});
	},

	//render the profile view (e.g. /views/show.ejs)
	show: function(req, res, next){

		User.findOne(req.params['id'], function foundUser(err, user){
			
			if(err) return next(err);
			if(!user) return next('User doesn\'t exist.');
			res.view({user:user});
		});
	},

	index: function(req, res, next){

		//Get an array of all users in the User collection
		User.find(function foundUsers (err, users){

			if(err) return next(err);

			
			//pass the array down to the /views/user/index.ejs page
			res.view({users: users});
		});
	},

	//render the edit view (/views/edit.ejs)
	edit: function(req, res, next){

		//find the user from id passed in via params
		User.findOne(req.params['id'], function foundUser(err, user){
			if(err) return next(err);
			if(!user) return next('User doesn\'t exist.');

			res.view({user:user});
		});
	},

	//process the info from edit view
	update: function(req, res, next){

		if(req.session.User.admin){

			var userObj = {name: req.param('name'), title: req.param('title'), email: req.param('email'), admin: req.param('admin')}
		}else {
			var userObj = {name: req.param('name'), title: req.param('title'), email: req.param('email')}
		}

		User.update(req.params['id'], userObj, function userUpdated(err, updatedUser){
			if(err){
				return res.redirect('/user/edit/' + req.params['id']);
			}

			User.publishUpdate(updatedUser[0].id, {}, req);

			res.redirect('user/show/' + req.params['id']);
		});

	},

	destroy: function(req, res, next){

		User.findOne(req.params['id'], function foundUser(err, user){
			if(err) return next(err);
			if(!user) return next('User doesn\'t exist.');

			User.destroy(req.params['id'], function userDestroyed(err){

				if(err) return next(err);

				User.publishDestroy(req.params['id'], req);
			});

			res.redirect('/user');
		});
	},

	subscribe: function(req, res){

		if (!req.isSocket) {
			return res.badRequest('Only a client socket can subscribe to Louies.  You, sir or madame, appear to be an HTTP request.');
		}

		//Get an array of all users in the User collection
		User.find(function foundUsers (err, users){

			if(err) return next(err);

			//Subscribe the requesting client socket to changes/deletions of one or more database records.
			//subscribe socket to the user instance rooms;
			User.subscribe(req.socket, users);

			//Enroll the requesting client socket in the "class room" for this model, 
			//causing it to receive broadcasts every time publishCreate() is called on this model. 
			//In addition, this client socket will be subscribed every new record it hears about automatically.
			//subscribe socket to the user model classroom;
			User.watch(req);

			
			res.send(200, users);
			
		});
	}


};

