var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var controllers = require('./controllers/index');
var beers = require('./controllers/beers');
var breweries = require('./controllers/breweries');
var http = require('http');
var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

/******CORS because of Chrome******/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
/******ROUTERS/CONTROLLERS******/
app.use('/beers', beers);
app.use('/breweries', breweries);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8010);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");


http.createServer(app).listen(app.get('port') ,app.get('ip'), function () {
  console.log("Express server listening at %s:%d ", app.get('ip'),app.get('port'));
  //server();
});
//module.exports = app;
