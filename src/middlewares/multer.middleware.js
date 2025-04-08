import multer from 'multer'
import path from 'path'
//storage ka middleware bnare a asi hun
const storage = multer.diskStorage({
    destination: function (req, file, cb)//file eh dsri k data nl file ari hoi je
     {
      cb(null, path.resolve('public/temp'))//cb means callback and jo sexond field hai oh path jithe asi store krania files temoporary
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)//vaise oroginal avoid krde a tnke multiple fiel j same name to hoiya then prob
    }
  })
  
 export const upload = multer({ storage, }) //storage:storafe is same as storage, as they both are same