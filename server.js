// Server Side Rendering
// An express nodejs server by Orajiaku Chibuchi Somto https://www.linkedin.com/in/orajiaku-c-0a051815a/
// Lunch node server.js to start server

const SEC_PORT = '5001';
const NODE_ENV_PORT = process.env.PORT || process.env.NODE_ENV;
const PORT = NODE_ENV_PORT || SEC_PORT;

const express = require('express');
const path = require('path');
const fs = require('fs');
const http =  require('http');
const compression = require('compression');
const _io = require('socket.io');
// const SocketController= require('./dist/app/controller/socket.controller.js');
const app = express();
const server = http.createServer(app);
// const socketservice= new SocketController();
// where '/dist/admin' is the final built directory
const staticRoot = __dirname + '/dist/Sparklingv2/';

app.set('port', PORT);

const io = _io(server,  {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: [],
      credentials: false
    }
  })

// Compression middleware
app.use(compression());
/* other middleware */
app.use(function(req, res, next) {
  next();
})
io.on('connection', (socket) => {
  console.log(`connected ${socket.id}`);
  // socketservice.newConnection(socket.id);
});

/* place any backend routes you have here */

app.use(function(req, res, next) {

    //if the request is not html then move along
    var accept = req.accepts('html', 'json', 'xml');
    if (accept !== 'html') {
        return next();
    }

    // if the request has a '.' assume that it's for a file, move along
    var ext = path.extname(req.path);
    if (ext !== '') {
        return next();
    }

    fs.createReadStream(staticRoot + 'index.html').pipe(res);

});

app.use(express.static(staticRoot));

// app.listen wont work as it creates a new app!!
server.listen(app.get('port'), function() {
    console.log('app running on port', app.get('port'));
});
