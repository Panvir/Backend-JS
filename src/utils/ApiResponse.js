class ApiResponse{
    constructor(statusCode,data,message = "Success"){
        this.statusCode=statusCode
        this.data = data
        this.message=message
        this.success=statusCode < 400 //statusCOde info responsesd 100 to 200 , client error 400 to 500 rahde ne eh net te pdho
    }
}
export {ApiResponse}