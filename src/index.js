import mongoose, { mongo } from "mongoose";
import express from 'express'
import { DB_NAME } from "./constants.js";
// require('dotenv').config({path:'./env'}) // eh sadi likhn di consistemcy khrab lreha
import dotenv from 'dotenv'
import { app } from "./app.js";
import connectDB from "./db/index.js" ;
dotenv.config({path:'./.env'})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MOngo db connection failed", err)
})

/*
import express from "express";

const app = express();

(async()=>{
    try{
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("error",()=>{console.log("Err: ",error);// k app chl v reha db nl sada agr nhi chlega tn err dsdega
        throw error
      })

      app.listen(process.env.PORT,()=>{
        console.log("App listtening on port ${process.env.PORT}");
      })
    }
    catch(error){
        console.error("ERROR: ",error)
        throw err
    }
})()
    */