class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went Wrong",
        errors=[],
        stack = ""//ie error stack
    ){
        //ethe overide krde a
        super(message)
        this.statusCode= statusCode
        this.data= null
        this.message= message
        this.success= false// koyki asi suuces nhi failure handle kre a
        this.errors=errors

        if(stack){
            // ye  pta lgta ha k kon kon si place ma kya error hai
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}