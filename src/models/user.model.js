import mongoose, { mongo, Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
const userSchema = new Schema({
    username:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true //db searching ch km anda hai
    },
    email:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullName:{
        type: String,
        required:true,
        trim:true,
        index:true //db searching ch km anda hai
    },
    avatar:{
        type:String, //hum cloudinary url use krege
        required:true,

    },
    coverImage:{
        type:String,
    },
    watchHistory:[//obv array di form ch ani a kyoki multiple add hingia
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String, //jab bhi pass save hunda encrypt hona chaida but dekhde a badch
        required:[true,'password is required']
    },
    refreshToken:{
        type:String
    }


},{timestamps:true})


userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10)
    next()
})// avoid writing arrow function in pre hook it cereates problem also pre ik hook hai jo pre ch km krdi hai 
//since eh middleware hai ute vali like tn next flag tn hona hi hona hai kyokikmhon to baad next cheej nu km v tn sompna
//but baat hai jo hook hai ohtn koi v cheej bdle te chleji baar baar pass nu hash kri jau so sanu if lana pya k jdo hi pass bdle ohnu hash kre dvar bs

//hun gl a sanu method bnana pyu like k jdo pass enter kre user tdo khule pr gl a pass tn oh normal enter kreha user sade db ch tn excrpyt store hoteha so asi hun ehte km kre a
//so custom methid bnande a 
userSchema.methods.isPassordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)// ehte sada bcypt hi pass nu check kreha ahi  2nf argumet sade db ch jo exrpy pass hai ohnu refer kreha hia
//compare true false dindi a
}


//etthe token kre a asi custim generate 
userSchema.methods.generateAccesToken=function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName //note k left side payload da name ya key hai te right sie ali cheej db cho ari a
         },
         process.env.ACCESS_TOKEN_SECRET,
         {
            expiresIn:process.env.ACESS_TOKEN_EXPIRY
         }
    )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
         {
             _id:this._id,
         },
          process.env.REFRESH_TOKEN_SECRET,
          {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY
          }
     )
 }//jo refresh tioken hunda ohc info ght undi a
export const User = mongoose.model("User",userSchema)