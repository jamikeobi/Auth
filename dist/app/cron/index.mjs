import deletecons from "./cron-delete.mjs";
import reminder from "./reminder.mjs";


function start(){
    deletecons.start();
    reminder.start();
}

export default {
    start,
    reminder,
    deletecons
};