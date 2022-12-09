const adminApiUrl = `https://livejs-api.hexschool.io/api/livejs/v1/admin/${apiPath}/orders`;

// 取得訂單

let orderList = [];

function getOrderList() {
  axios
    .get(`${adminApiUrl}`, config)
    .then((res) => {
      orderList = res.data.orders;
      renderOrderList(orderList);
      renderCategoryC3(orderList);
      renderProductC3(orderList);
    })
    .catch((err) => console.log(err));
}
getOrderList();

// 渲染訂單列表
const orderTableBody = document.querySelector(".order-table-body");

function renderOrderList(data) {
  let listStr = "";
  let orderStatus = "";
  if(data.length === 0){
    deleteAllBtn.classList.add('d-none');
  }else{
    deleteAllBtn.classList.remove('d-none');
  }
  data.forEach((i) => {
    let productStr = "";
    let timeStamp = new Date(i.createdAt * 1000);
    let orderTime = `${timeStamp.getFullYear()}/${
      timeStamp.getMonth() + 1
    }/${timeStamp.getDate()}`;
    i.products.forEach((productItem) => {
      productStr += `<p>${productItem.title}x ${productItem.quantity}</p>`;
    });
    if (i.paid) {
      orderStatus = "已處理";
    } else {
      orderStatus = "未處理";
    }

    listStr += ` <tr>
        <td>${i.id}</td>
        <td>
          <p>${i.user.name}</p>
          <p>${i.user.tel}</p>
        </td>
        <td>${i.user.address}</td>
        <td>${i.user.email}</td>
        <td>
        ${productStr}
        </td>
        <td>${orderTime}</td>
        <td class="orderStatus">
          <a href="#" data-status="${i.paid}" data-id="${i.id}">${orderStatus}</a>
        </td>
        <td>
          <input type="button" data-delete data-id="${i.id}" class="delSingleOrder-Btn" value="刪除">
        </td>
    </tr>`;
  });
  orderTableBody.innerHTML = listStr;
}

// 訂單處理
orderTableBody.addEventListener("click", function (e) {
  e.preventDefault();
  if (
    !e.target.hasAttribute("data-delete") &&
    !e.target.hasAttribute("data-status")
  ) {
    return;
  }
  let orderID = e.target.dataset.id;
  let status = e.target.dataset.status;
  // 刪除單筆訂單
  if (e.target.hasAttribute("data-delete")) {
    deleteOrder(orderID);
  }
  // 訂單處理狀態
  if (e.target.hasAttribute("data-status")) {
    renderOrderStatus(status, orderID);
  }
});

// 刪除單筆訂單
function deleteOrder(id) {
  orderList.forEach((item) => {
    if (item.id === id) {
      axios
        .delete(`${adminApiUrl}/${id}`, {
          headers: {
            Authorization: token,
          },
        })
        .then((res) => {
          getOrderList();
          alert(`已刪除該筆訂單`);
        })
        .catch((err) => alert('刪除失敗'));
    }
  });
}
// 訂單處理狀態
function renderOrderStatus(status, id) {
  let newStatus;
  if (status === "true") {
    newStatus = false;
  } else {
    newStatus = true;
  }
  axios
    .put(
      `${adminApiUrl}`,
      {
        data: {
          id: id,
          paid: newStatus,
        },
      },
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then((res) => {
      getOrderList();
      alert(`已更新訂單資訊`);
    })
    .catch((err) => alert('更新失敗'));
}

// 刪除全部訂單
const deleteAllBtn = document.querySelector(".discardAllBtn");
deleteAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios
    .delete(`${adminApiUrl}`, config)
    .then((res) => {
      getOrderList();
      alert(`已刪除全部訂單`);
    })
    .catch((err) => alert('刪除失敗'));
});

// 全產品類別營收比重
function renderCategoryC3(orderList) {
  let total = {};
  orderList.forEach((i) => {
    i.products.forEach((item) => {
      if (total[item.category] === undefined) {
        total[item.category] = item.price * item.quantity;
      } else {
        total[item.category] += item.price * item.quantity;
      }
    });
  });
  let categoryName = Object.keys(total);
  let categoryData = [];
  categoryName.forEach((i) => {
    let arr = [];
    arr.push(i);
    arr.push(total[i]);
    categoryData.push(arr);
  });
  let chart = c3.generate({
    bindto: "#categoryChart", // HTML 元素綁定
    data: {
      type: "pie",
      columns: categoryData,
      colors: {
        床架: "#DACBFF",
        收納: "#9D7FEA",
        窗簾: "#5434A7",
        // 其他: "#301E5F",
      },
    },
  });
}

// 全品項營收比重
function renderProductC3(orderList) {
  let total = {};
  orderList.forEach((i) => {
    i.products.forEach((item) => {
      if (total[item.title] === undefined) {
        total[item.title] = item.price * item.quantity;
      } else {
        total[item.title] += item.price * item.quantity;
      }
    });
  });
  let productName = Object.keys(total);
  let productData = [];
  productName.forEach((i) => {
    let arr = [];
    arr.push(i);
    arr.push(total[i]);
    productData.push(arr);
  });
  productData.sort((a, b) => b[1] - a[1]);
  let sortProductData = [];
  let other = 0;
  productData.forEach((item, index) => {
    if (index <= 2) {
      sortProductData.push(item);
      return;
    } else {
      other += item[1];
      return;
    }
  });
  sortProductData.push(["其他", other]);

  let chart = c3.generate({
    bindto: "#productChart", // HTML 元素綁定
    data: {
      type: "pie",
      columns: sortProductData,
    },
    color: {
      pattern: ["#DACBFF", "#9D7FEA", "#5434A7", "#301E5F"],
    },
  });
}

// 圖表切換
const chartBtn = document.querySelector(".chart-btn");
const chartBtnItem = document.querySelectorAll(".chart-btn li a");
const chartBlock = document.querySelectorAll("[data-chartBlock]");
chartBtn.addEventListener("click", function (e) {
  e.preventDefault();
  chartBtnItem.forEach((i) => {
    i.classList.remove("active");
  });
  e.target.classList.add("active");
  chartBlock.forEach((i) => {
    i.classList.add("d-none");
    if (i.dataset.chartblock === e.target.getAttribute("data-chart")) {
      i.classList.remove("d-none");
    }
  });
});

