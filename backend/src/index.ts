import "./utils/dotenv.js"
import checkconnectDb from "./db/indexdb.js";
import { app } from "./app.js"

checkconnectDb()
.then(()=>{
    app.listen(process.env.PORT_CONNECT || 5000 , () => {
        console.log(`Server is running on port ${process.env.PORT_CONNECT?process.env.PORT_CONNECT:5000}`);
    })
})
.catch((err)=>{
    console.error('Failed to start the application:', err);
})