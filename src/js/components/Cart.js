import {select, classNames, templates, settings} from '../settings.js';
import CartProduct from "./CartProduct.js";
import utils from '../utils.js';

class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
      //console.log('new Cart', thisCart);
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);

    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function(event ){
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      }); 
    }

    add(menuProduct){
      const thisCart = this;
  
        /* generate HTML based on template */
        const generatedHTML = templates.cartProduct(menuProduct);
        /* create element using utils.createElementFromHTML */ 
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        /* add element to menu */
        thisCart.dom.productList.appendChild(generatedDOM);
        thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
        //console.log('thisCart.produts', thisCart.products); 
        thisCart.update();
      }

      update() {
        const thisCart = this;
      
        thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
        thisCart.totalNumber = 0;
        thisCart.subtotalPrice = 0;
      
        for (let producted of thisCart.products) {
          thisCart.totalNumber += producted.amount;
          thisCart.subtotalPrice += producted.price;
        }
      
        if (!thisCart.totalNumber) {
          thisCart.deliveryFee = 0;
        }
      
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      
        thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
        thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
        thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
        for (let domTotalPrice of thisCart.dom.totalPrice) {
          domTotalPrice.innerHTML = thisCart.totalPrice
        }
      }
      
      remove(CartProduct){
        const thisCart = this;

        const indexOfProduct = thisCart.products.indexOf(CartProduct)
        thisCart.products.splice(indexOfProduct, 1)

        CartProduct.dom.wrapper.remove();
        thisCart.update();

      }

      sendOrder(){
        const thisCart = this;

        const url = settings.db.url + '/' + settings.db.orders;

        const payload = {
          address: thisCart.dom.address.value,
          phone: thisCart.dom.phone.value,
          totalPrice: thisCart.totalPrice,
          subtotalPrice: thisCart.subtotalPrice,
          totalNumber: thisCart.totalNumber,
          deliveryFee: settings.cart.defaultDeliveryFee,
          products: [],
        };

        for(let prod of thisCart.products){
          payload.products.push(prod.getData());
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

  }

  export default Cart;