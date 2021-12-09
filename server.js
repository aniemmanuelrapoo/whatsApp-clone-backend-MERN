//importing
const { json } = require('express')
const express = require('express')
const mongoose = require('mongoose')
const Messages = require('./dbMessages')
const Pusher = require("pusher");

//app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1314449",
    key: "1210b3fbb4810fdd4c7c",
    secret: "46abfd50af9d7c688b52",
    cluster: "eu",
    useTLS: true
});

//middleware
app.use(express.json())

//DB Config
const connection_url= 'mongodb+srv://rapoo:rapoo151@cluster0.gzo6l.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

//???
const db = mongoose.connection
db.once('open',() => {
    console.log("DB connected")

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change) => {
        console.log(change)

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.user,
                    message: messageDetails.message
                }
            );
        } else{
            console.log('Error Triggering Pusher')
        }
    })
})

//api routes
app.get('/', (req, res) => {
    res.status(200).send("hello world");
})

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

//listening
app.listen(port, () => console.log(`Listening on localhost: ${port}`))