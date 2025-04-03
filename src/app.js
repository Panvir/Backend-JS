import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser"//ehde nl asi user de browser tp cookies ecces kr pande a te change kr paande a, CRUD opertaion basicaly
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))//cors() eda v ho skda c pr asi hor detail ch options dkehiya ehdia

app.use(express.json({limit: "16kb"})) // ehvi middleware hai jithe asi dsre jai k json hi asi expect krde haaa, also json dta kina aye ohnu v limit kreya hai so thaht server hina crash hoje

app.use(express.urlencoded({extended:true, limit:"16kb"}))// yaad asi kuch v search krde hai tn url ch bdia cheeja andia ne oh encodong hundi a 
//urlecoded lokheke kla v km h skda c pr gl a options nu explore kre a ess ele asi,, extended nl object and object a skda url ch
app.use(express.static("public"))//stattic nl asi files folrder like odf images asi apnehi server te store krna chande a
//sade case ch public ik folder hai jithe awi rakhuge smaan
app.use(cookieParser())


export { app }