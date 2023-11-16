import {classNames, select, settings, templates} from "../settings.js";
import utils from "../utils.js";
import amountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";


class Booking{
    constructor(element){
        const thisBooking = this;
        
        thisBooking.selectedTable = null;
        thisBooking.selectedStarters = [];
        
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

        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        
        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
            thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
            }
          }
        }
        //console.log('thisBooking.booked', thisBooking.booked)
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            //console.log('loop', hourBlock)  
          
        if(typeof thisBooking.booked[date] [hourBlock] == 'undefined'){
            thisBooking.booked[date] [hourBlock] = [];
        }

        thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM(){
        const thisBooking = this;

        const activeTable = thisBooking.dom.allTables.querySelector(select.booking.tableSelected);
        
        if(activeTable){
            activeTable.classList.remove(classNames.booking.tableSelected);
        }

        thisBooking.selectedTable = null;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;
        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }
        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
                tableId = parseInt(tableId);
            }

            if(
              !allAvailable
              &&
              thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) 
              ){
                table.classList.add(classNames.booking.tableBooked);
              } else{
                table.classList.remove(classNames.booking.tableBooked);
              }
        }
    }

   initTables(event) {
     const thisBooking = this;
     const clickedElement = event.target;

     if(!clickedElement.classList.contains(classNames.booking.table)){
        return false;
     }

     if(clickedElement.classList.contains(classNames.booking.tableBooked)){
        alert('Table is booked!')
        return false;
     }

     if(clickedElement.classList.contains(classNames.booking.tableSelected)){
        clickedElement.classList.remove(classNames.booking.tableSelected)
        thisBooking.selectedTable = null;
     }else{
        const activeTable = thisBooking.dom.allTables.querySelector(select.booking.tableSelected);

        console.log(activeTable, thisBooking.dom.allTables)
        if(activeTable){
            activeTable.classList.remove(classNames.booking.tableSelected);
        }

        clickedElement.classList.add(classNames.booking.tableSelected);
        thisBooking.selectedTable = clickedElement.getAttribute('data-table');

     }
      
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
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.allTables = thisBooking.dom.wrapper.querySelector(select.booking.allTables);

        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.bookTable = thisBooking.dom.wrapper.querySelector(select.booking.bookTable);
        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(select.booking.starters);
        

    }

    takeStartersTable(){
        const thisBooking = this;

        thisBooking.selectedStarters = [];
        
        for(const starter of thisBooking.dom.starters){
            if(starter.checked){
                thisBooking.selectedStarters.push(starter.value);
            }
        }
        return thisBooking.selectedStarters;
    }

    sendBooking(){
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.bookings;

        const payload = {
          address: thisBooking.dom.address.value,
          phone: thisBooking.dom.phone.value,
          date: thisBooking.dom.datePicker.value,
          hour: thisBooking.dom.hourPicker.value,
          table: parseInt(thisBooking.selectedTable),
          duration: parseInt(thisBooking.dom.hoursAmount.value),
          ppl: parseInt(thisBooking.dom.peopleAmount.value),
          
        };

        for(let prod of thisBooking.products){
          payload.products.push(prod.takeStartersTable());
        }

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };
        
        fetch(url, options);
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

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });

        thisBooking.dom.allTables.addEventListener('click', function(event){
            thisBooking.initTables(event);
        });
    }
}



export default Booking;