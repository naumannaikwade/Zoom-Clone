const express =require("express");
const http=require("http");
const socketIo=require("socket.io")
const mongoose=require("mongoose");
const cors=require("cors");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const { timeStamp } = require("console");
const authRouter=require("./routes/auth");
const meetingRoutes = require('./routes/meetings');

require("dotenv").config();

const app=express();
const server=http.createServer(app);
const io=socketIo(server,{
    cors:{
        origin:process.env.CORS_ORIGIN,
        methods:['GET','POST']
    }
});

//security middleware
app.use(helmet());
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}));

//rate limit
const limiter=rateLimit({
    windowMs:15*60*1000,
    max:100
});
app.use(limiter);

//body parser
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true}));

//database connection
mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log("mongoDB Connected"))
.catch(err=> console.log("mongoDB connection error: ",err));

//routes
app.use("/api/auth",authRouter);
app.use('/api/meetings', meetingRoutes);

//health check api
app.get("/api/health",(req,res)=>{
    res.status(200).json({status:"ok",timeStamp:new Date().toISOString() })
})

//socket.io setup 
io.on("connection",(socket)=>{
    console.log('user connected:',socket.id);

    socket.on("disconnect",()=>{
        console.log("user disconnected",socket.id);
    });
});
// Add after socket.io setup
const setupSocketHandlers = require('./socket/socketHandlers');
setupSocketHandlers(io);

const PORT =process.env.PORT || 5000;

server.listen(PORT,()=>{
    console.log(`server is listing on port ${PORT}`)
});

module.exports={app,io};