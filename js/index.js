const apiUrl = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiPath}`;

const productWrap = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const chartList = document.querySelector(".shoppingCart-table-body");

const totalPrice = document.querySelector(".totalPrice");

let productData = [];
let chartData = [];
let finalTotal = 0;

// 取得產品列表
function getProductData() {
  axios
    .get(`${apiUrl}/products`)
    .then((res) => {
      productData = res.data.products;
      renderProductData(productData);
      getChartList();
    })
    .catch((err) => console.log(err.response));
}
getProductData();

// 渲染頁面
function renderProductData(data) {
  let str = "";
  data.forEach((i) => {
    str += `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${i.images}" alt="product">
        <a href="#" class="addCardBtn" data-id="${i.id}">加入購物車</a>
        <h3>${i.title}</h3>
        <del class="originPrice">NT$${toThousand(i.origin_price)}</del>
        <p class="nowPrice">NT$${toThousand(i.price)}</p>
    </li>`;
  });
  productWrap.innerHTML = str;
}

// 產品篩選功能
productSelect.addEventListener("change", function (e) {
  let category = e.target.value;
  let filterData = [];
  if (category == "全部") {
    filterData = productData;
  } else if (category == "床架") {
    filterData = productData.filter((i) => i.category == "床架");
  } else if (category == "收納") {
    filterData = productData.filter((i) => i.category == "收納");
  } else if (category == "窗簾") {
    filterData = productData.filter((i) => i.category == "窗簾");
  }
  renderProductData(filterData);
});

// 加入購物車(按鈕)
productWrap.addEventListener("click", function (e) {
  e.preventDefault();
  if (!e.target.getAttribute("class", "addCardBtn")) {
    return;
  }
  let productNum = 1;
  let productID = e.target.dataset.id;
  chartData.forEach((i) => {
    if (i.product.id == productID) {
      productNum = i.quantity + 1;
    }
  });
  axios
    .post(`${apiUrl}/carts`, {
      data: {
        productId: productID,
        quantity: productNum,
      },
    })
    .then((res) => {
      getChartList();
      alert(`已加入購物車`);
    })
    .catch((err) => console.log(err.response));
});

// 取得購物車資訊
function getChartList() {
  axios
    .get(`${apiUrl}/carts`)
    .then((res) => {
      chartData = res.data.carts;
      finalTotal = `$${toThousand(res.data.finalTotal)}`;
      renderChartList(chartData, finalTotal);
    })
    .catch((err) => console.log(err.response));
}

// 渲染我的購物車列表
function renderChartList(data, finalTotal) {
  let str = "";
  if (data.length == "") {
    str += `
        <tr>
        <td>
                <p>目前購物車內沒有品項</p>

        </td>
    </tr>`;
  }
  data.forEach((i) => {
    str += `
        <tr>
        <td>
            <div class="cardItem-title">
                <img src="${i.product.images}" alt="">
                <p>${i.product.title}</p>
            </div>
        </td>
        <td>NT$${toThousand(i.product.price)}</td>
        <td>${i.quantity}</td>
        <td>NT$${toThousand(i.product.price * i.quantity)}</td>
        <td class="discardBtn">
            <a href="#" class="material-icons" data-delete data-id="${i.id}">
                clear
            </a>
        </td>
    </tr>`;
  });
  chartList.innerHTML = str;
  totalPrice.textContent = finalTotal;
}

// 刪除單筆
chartList.addEventListener("click", function (e) {
  e.preventDefault();
  if (!e.target.hasAttribute("data-delete")) {
    return;
  }
  let chartID = e.target.dataset.id;
  chartData.forEach((item) => {
    if (item.id === chartID) {
      axios
        .delete(`${apiUrl}/carts/${chartID}`)
        .then((res) => {
          getChartList();
          alert(`已刪除該品項`);
        })
        .catch((err) => console.log(err.response));
    }
  });
});

// 刪除全部
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios
    .delete(`${apiUrl}/carts`)
    .then((res) => {
      getChartList();
      alert(`已刪除所有品項`);
    })
    .catch((err) => console.log(err.response));
});

// 送出訂單+表單驗證
const orderInfoBtn = document.querySelector(".orderInfo-btn");
const orderForm = document.querySelector(".orderInfo-form");
// 驗證條件
let constraints = {
  "姓名":{
    presence:{
      message:"必填"
    }
  },
  "電話":{
    presence:{
      message:"必填"
    },
    format: {
      pattern: new RegExp('^09\\d{8}$'),
      flags: "i",
      message: "只接受手機號碼"
    }
  },
  "Email":{
    presence:{
      message:"必填"
    },
    email: {
      message:"格式錯誤"
    },
  },
  "寄送地址":{
    presence:{
      message:"必填"
    }
  }
}

orderInfoBtn.addEventListener("click", function (e) {
  e.preventDefault();
  const customerName = document.querySelector("#customerName").value;
  const customerPhone = document.querySelector("#customerPhone").value;
  const customerEmail = document.querySelector("#customerEmail").value;
  const customerAddress = document.querySelector("#customerAddress").value;
  const customerTradeWay = document.querySelector("#tradeWay").value;
  
  if (chartData.length == "") {
    alert("請將品項加入購物車");
    return;
  }
 
  let error = validate(orderForm, constraints);
  if(error){
    showError(error)
  }else{
axios
    .post(`${apiUrl}/orders`, {
      data: {
        user: {
          name: customerName,
          tel: customerPhone,
          email: customerEmail,
          address: customerAddress,
          payment: customerTradeWay,
        },
      },
    })
    .then((res) => {
      alert("訂單已送出囉～");
      getChartList();
      orderForm.reset();
    })
    .catch((err) => console.log(err.response));
  }
});


function showError(error){
  const errorMessage = document.querySelectorAll('[data-message]');
  errorMessage.forEach(i=>{
    i.textContent = error[i.dataset.message]
  })
}

const orderFormInputs = document.querySelectorAll('.orderInfo-input');
orderFormInputs.forEach(i=>{
  i.addEventListener('change',function(e){
    let error = validate(orderForm, constraints);
    i.nextElementSibling.textContent = "";
    if(error){
      showError(error)
    }
  })
})

// utility js
function toThousand(n) {
  var parts = n.toString().split(".");
  const numberPart = parts[0];
  const decimalPart = parts[1];
  const thousands = /\B(?=(\d{3})+(?!\d))/g;
  return (
    numberPart.replace(thousands, ",") + (decimalPart ? "." + decimalPart : "")
  );
}
