import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";// aggregate pipeline tnke data fragments ch load hoe katha hon nalo
const videoSchema=new Schema({
    videoFile:{
        public_id:{ type : String, required: true},
        url:{type:String, required: true},//string url da cloudinary
       
    },
    thumbnail:{
        public_id:{ type : String},
        url:{type:String},//string url da cloudinary
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,//cloudanry hi dyega ehdi info bda kaint cheej a oho
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"// kyoki owner user ch hi hoega obv tn krk
    }

},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) //ehde nl asi paginatio krde a videos lyi mtlb 10 video di page bnake bhejna katha na pejna sari videos nu see gpt
export const Video = mongoose.model("Video",videoSchema)