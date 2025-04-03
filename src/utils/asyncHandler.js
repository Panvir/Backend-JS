const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}




// const asyncHandler=()=>{}
// const asyncHandler=(func)=>()=>{}//ehki hunda function nu agge is hor agge paramenter ch paas krta basically agge te agge pass krta
// //te ise nu async bnan lyi jinu pass kreya ohnu async bnado
// const asyncHandler=(func)=>async()=>{}

    //most of the cases ch ece da dikhega jida niche given a pr hor v ho ksda ehda, promiised ch hund ajo k top te a
// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }