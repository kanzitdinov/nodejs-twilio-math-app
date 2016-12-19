var express = require('express');
var bodyParser = require('body-parser');

import Firebase from './firebase';

var opts = {};
var wolfram = require('wolfram-alpha').createClient("YOUR_CLIENT_ID", opts);

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio Credentials
var accountSid = 'YOUR_ACCOUNT_SECRET_ID';
var authToken = 'YOUR_AUTH_TOKEN';
var client = require('twilio')(accountSid, authToken);

// REQUEST TO WOLFRAM ALPHA
app.post('/waeducation', function(req, res) {
  // console.log(req.query);
  var msgFrom = String(req.body.From);
  var msgBody = String(req.body.Body).trim();

  // console.log('+' + msgBody.slice(0, 5) + '+ +' + (msgBody.slice(0, 5) == 'MATH '));

  if (msgBody.slice(0, 5) == 'MATH ') {
    msgBody = msgBody.slice(5);

    // TODO: ALSO SAVE IN DATABASE TO GET RESULTS FASTER

    console.log(msgFrom);
    console.log(msgBody);

    var query = msgBody.trim();
    var resultString = '';

    findSolution(query)
      .then((solution) => {

        console.log('DATABASE');
        resultString = solution.result;

        sendMessageWithResult(resultString, msgFrom)
          .then(() => {
            myLog(`<h1>Solution is sent to ${msgFrom}</h1><p>${resultString}</p>`, res);
          }, (error) => {
            myLog(error);
          })

      }, (error) => {

        console.log('WOLFRAM');
        wolframQuery(query)
          .then((result) => {
            resultString = result;

            sendMessageWithResult(resultString, msgFrom)
              .then(() => {
                saveSolution(query, resultString);
                myLog(`<h1>Solution is sent to ${msgFrom}</h1><p>${resultString}</p>`, res);
              }, (error) => {
                myLog(error);
              })

          }, (error) => {
            myLog(error, res);
          });

      })

  } else {

    myLog(`Can't make a request with -> ${msgBody}`, res)

  }

})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// HELP METHODS

function myLog(text, res) {
  console.log(text);
  res.send(`<p>${text}</p>`);
}

function findSolution(query) {
  return new Promise((resolve, reject) => {

    Firebase.SolutionsRefs
      .orderByChild("query")
      .equalTo(query)
      .on("value", function (snapshot) {
        console.log(`SNAPSHOT IN EDUCATION :: ${JSON.stringify(snapshot.val())}`);
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var childData = childSnapshot.val();
          resolve(childData);
          return;
        });
        reject();
        resolve();
      });
  })
}

function sendMessageWithResult(result, toNumber) {
  return new Promise((resolve, reject) => {

    client.messages.create({
      from: "+19177464171",
      to: toNumber,
      body: result
    }, function(err, message) {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });

  })
}

function wolframQuery(query) {
  return new Promise((resolve, reject) => {

    wolfram.query(query, function (err, result) {
      if (err) reject(err);

      var resultString = '';
      for (var i = 0; i < result.length; i++) {
        var r = result[i];
        // console.log(r);
        if (r.primary) {
          resultString += r.title + ':\n' + r.subpods[0].text.trim() + '\n\n';
        }
      }
      resultString = resultString.slice(0, -2);

      resolve(resultString);
    })
  });
}

function saveSolution(query, result) {
  var solutionData = { query, result };

  var newPostKey = Firebase.SolutionsRefs.push().key;
  Firebase.SolutionsRefs.child(newPostKey).set(solutionData);
}
