var request = require('request'),
	http = require('http'),
	Firebase = require('firebase'),
	CronJob = require('cron').CronJob,
	eventsRef = new Firebase('https://sportsbettr2.firebaseio.com/events'),
	usersRef = new Firebase('https://sportsbettr2.firebaseio.com/users'),
	calendarRef = new Firebase('https://sportsbettr2.firebaseio.com/calendar'),
	leaguesRef = new Firebase('https://sportsbettr2.firebaseio.com/leagues'),
	fixtures = 'http://football-api.com/api/?Action=fixtures&APIKey=5e83f197-5583-841b-390fc408b747&&from_date=26.12.2014&&to_date=31.12.2014',
	leagues = 'http://football-api.com/api/?Action=competitions&APIKey=5e83f197-5583-841b-390fc408b747',
	url = 'http://football-api.com/api/?Action=today&APIKey=5e83f197-5583-841b-390fc408b747';


//При каждом обновлении данных в фаербазе делаем что написано ниже
	eventsRef.on('value', function(snapshot) {
	    var snapshotVal = snapshot.val();

	    //Есть ли события в базе
	    if (snapshotVal !== null) {

	    //Если есть лупим через все события
	    for (var i=0; i < snapshotVal.length; i++) {
	    	
	    	//Если событие закончилось (Статус ФТ) и в нем есть ставки
	    	if (snapshotVal[i].match_status == 'FT' && snapshotVal[i].match_predictions !== '') {

				//Записываем в переменные путь к счету матча и путь к прогнозам пользователей
				var predictions = snapshotVal[i].match_predictions,
	      			match_score1 = snapshotVal[i].match_ft_score[1],
	      			match_score2 = snapshotVal[i].match_ft_score[3];

				//Перебираем все пользовательские прогнозі по ключу (юзер айди)
				for(key in predictions){

					//если расчет очьков по прогнозу не проводился
					if (predictions[key].points == '') {

					//Пишем в переменные прогноз пользователя, путь к его юзер базе и его очкам 	
	      			var user_score1 = predictions[key].score[0],
	      				user_score2 = predictions[key].score[1],
	      				user_idRef =  usersRef.child('/'+key+'/'),
						user_pointsRef = eventsRef.child('/'+i+'/match_predictions/'+key+'/'),
						user_total_pointsRef = usersRef.child('/'+key+'/total_points/'),
						distance = Math.abs(user_score1-match_score1)+Math.abs(user_score2-match_score2),
						user_total_points = 0;

						user_total_pointsRef.once("value", function(snap) {
  							user_total_points = snap.val();

				      		switch (distance) {
				      				case 0:
				      					var new_user_total_points = user_total_points+100;
				      					user_pointsRef.update({"points": 100});
				      					user_idRef.update({"total_points":new_user_total_points});
				      					console.log(user_total_points);
				      					break
				      				case 1:
				      					var new_user_total_points = user_total_points+50;
				      					user_pointsRef.update({"points": 50});
				      					user_idRef.update({"total_points":new_user_total_points});
				      					console.log(user_total_points);
				      					break
				      				case 2:
				      					var new_user_total_points = user_total_points+25;
				      					user_pointsRef.update({"points": 25});
				      					user_idRef.update({"total_points":new_user_total_points});
				      					console.log(user_total_points);
				      					break
				      				case 3:
				      					var new_user_total_points = user_total_points+10;
				      					user_pointsRef.update({"points": 10});
				      					user_idRef.update({"total_points":new_user_total_points});
				      					console.log(user_total_points);
				      					break
				      				default:
				      					var new_user_total_points = user_total_points+5;
				      					user_pointsRef.update({"points": 5});
				      					user_idRef.update({"total_points":new_user_total_points});
				      					console.log(user_total_points);
				      		}

						});


					} else console.log("Очьки по событию уже пощитаны!");

				}

	    	} else console.log("Событие не закончилось или в нем нет ставок");
	    }

	    } else console.log("На сегодня событий нет");
	});


var populatingMatchList = new CronJob({
  cronTime: '00 07 12 * * *',
  onTick: function() {
  	var events = [];
  	eventsRef.remove();
    // Runs every weekday (Monday through Friday)
	http.get(url, function(res) {
	    var body = '';

	    res.on('data', function(chunk) {
	        body += chunk;
	    });

	    res.on('end', function() {
	        var FootballApiResponse = JSON.parse(body)
	        var events_data = FootballApiResponse.matches;
	        if (FootballApiResponse.hasOwnProperty("matches")) {

		        for (i=0; i < events_data.length; i++) {
		          events.push(events_data[i]);
		        };
		        eventsRef.set(events);
		        console.log("TODAY events updated!");
		        
		        for (i=0; i < events_data.length; i++) {
		        	eventsRef.child('/'+i+'/').update({
		        		"_id":i,
		        		"match_predictions": ""
		        	});
		        }
	        } else console.log("API error");
	    });
	}).on('error', function(e) {
	      console.log("Got error: ", e);
	})
  },
  start: false
});

var updatingMatchList = new CronJob({
  cronTime: '*/5 * * * * *',
  onTick: function() {
	http.get(url, function(res) {
	    var body = '';

	    res.on('data', function(chunk) {
	        body += chunk;
	    });

	    res.on('end', function() {
	        var FootballApiResponse = JSON.parse(body)
	        var events_data = FootballApiResponse.matches;
	        if (FootballApiResponse.hasOwnProperty("matches")) {

		        for (i=0; i < events_data.length; i++) {
		          eventsRef.child('/'+i+'/').update(events_data[i]);
		          //console.log(eventsRef[3]);
		        };

	        } else console.log("API error");
	    });
	}).on('error', function(e) {
	      console.log("Got error: ", e);
	})
  },
  start: false
});

var populatingCalendar = new CronJob({
  cronTime: '00 23 15 * * *',
  onTick: function() {
  	var calendar = [];
    // Runs every weekday (Monday through Friday)
	http.get(fixtures, function(res) {
	    var body = '';

	    res.on('data', function(chunk) {
	        body += chunk;
	    });

	    res.on('end', function() {
	        var FootballApiResponse = JSON.parse(body)
	        var events_data = FootballApiResponse.matches;
	        if (FootballApiResponse.hasOwnProperty("matches")) {

		        for (i=0; i < events_data.length; i++) {
		          calendar.push(events_data[i]);
		        };
		        calendarRef.set(calendar);
		        console.log("CALENDAR events updated!");
		        
	        } else console.log("CALENDAR API error");
	    });
	}).on('error', function(e) {
	      console.log("Got error: ", e);
	})
  },
  start: false
});

var populatingLeagues = new CronJob({
  cronTime: '00 02 13 * * *',
  onTick: function() {
  	var calendar = [];
    // Runs every weekday (Monday through Friday)
	http.get(leagues, function(res) {
	    var body = '';

	    res.on('data', function(chunk) {
	        body += chunk;
	    });

	    res.on('end', function() {
	        var FootballApiResponse = JSON.parse(body)
	        var events_data = FootballApiResponse.Competition;
	        if (FootballApiResponse.hasOwnProperty("Competition")) {

		        for (i=0; i < events_data.length; i++) {
		          calendar.push(events_data[i]);
		        };
		        leaguesRef.set(calendar);
		        console.log("CALENDAR events updated!");
		        
	        } else console.log("CALENDAR API error");
	    });
	}).on('error', function(e) {
	      console.log("Got error: ", e);
	})
  },
  start: false
});

populatingMatchList.start();
updatingMatchList.start();
populatingCalendar.start();
populatingLeagues.start();
