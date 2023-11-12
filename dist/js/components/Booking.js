import {select, templates} from "../settings.js";
import amountWidget from "./AmountWidget.js";


class Booking{
    constructor(element){
        const thisBooking = this;
        
        thisBooking.render(element);
        thisBooking.initWidgets();
    }

    render(element){
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

        const generatedHTML =  templates.bookingWidget();
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new amountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener("updated", function () {});

        thisBooking.hoursAmount =  new amountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener("updated", function () {});
    }
}



export default Booking;