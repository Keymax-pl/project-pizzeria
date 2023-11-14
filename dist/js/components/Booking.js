import {select, settings, templates} from "../settings.js";
import utils from "../utils.js";
import amountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";


class Booking{
    constructor(element){
        const thisBooking = this;
        
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            bookings: [
                startDateParam, 
                endDateParam,            ],

            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam, 
                endDateParam, 
            ],

            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam, 
            ],
        };

        //console.log('Params:', params);

        const urls = {
            bookings:       settings.db.url + '/' + settings.db.bookings 
                                            + '?' + params.bookings.join('&'),
            eventsCurrent: settings.db.url  + '/' + settings.db.events   
                                            + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url  + '/' + settings.db.events   
                                            + '?' + params.eventsRepeat.join('&'),
        };
        //console.log('getData', urls);
        Promise.all([
          fetch(urls.bookings),
          fetch(urls.eventsCurrent),
          fetch(urls.eventsRepeat),
        ])
          .then(function(allResponses){
            const bookingsResponse =  allResponses[0];
            const eventsCurrentResponse =  allResponses[1];
            const eventsRepeatResponse =  allResponses[2];
            return Promise.all([
              bookingsResponse.json(),
              eventsCurrentResponse.json(),
              eventsRepeatResponse.json(),
            ]);
          })
          .then(function([bookings, eventsCurrent, eventsRepeat]){
            //console.log(bookings);
            //console.log(eventsCurrent);
            //console.log(eventsRepeat);
            thisBooking.parseData(bookings,eventsCurrent, eventsRepeat);
          });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        thisBooking.booked[date][hour].push(table);
    }

    render(element){
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;

        const generatedHTML =  templates.bookingWidget();
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new amountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener('updated', function () {});

        thisBooking.hoursAmount =  new amountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener('updated', function () {});

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.dom.datePicker.addEventListener('updated', function(){});

        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        thisBooking.dom.hourPicker.addEventListener('updated', function(){});
    }
}



export default Booking;