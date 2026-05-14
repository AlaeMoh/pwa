var promiseDB = idb.open("MyStore", 6, function (upgradeDB) {
    if (!upgradeDB.objectStoreNames.contains("Products")) {
        const productStore = upgradeDB.createObjectStore("Products", {
            keyPath: "id",
            autoIncrement: true,
        });
        productStore.createIndex("name", "name", { unique: false });
    }

    if (!upgradeDB.objectStoreNames.contains("Orders")) {
        const orderStore = upgradeDB.createObjectStore("Orders", {
            keyPath: "orderId",
            autoIncrement: true,
        });
        orderStore.createIndex("productName", "productName", { unique: false });
    }
});

const sampleProducts = [
    { name: "Couch", price: 599.99, color: "Gray", material: "Fabric", stock: 15 },
    { name: "Armchair", price: 299.99, color: "Brown", material: "Leather", stock: 8 },
    { name: "Coffee Table", price: 149.99, color: "Oak", material: "Wood", stock: 20 },
    { name: "Desk Lamp", price: 45.99, color: "Black", material: "Metal", stock: 50 },
    { name: "Bookshelf", price: 189.99, color: "White", material: "Wood", stock: 12 }
];

const sampleOrders = [
    { productName: "Couch", quantity: 2, price: 599.99, color: "Gray", material: "Fabric" },
    { productName: "Armchair", quantity: 1, price: 299.99, color: "Brown", material: "Leather" },
    { productName: "Desk Lamp", quantity: 3, price: 45.99, color: "Black", material: "Metal" }
];

document.getElementById("prdBtn").onclick = function () {
    promiseDB.then(function (DB) {
        const tx = DB.transaction("Products", "readwrite");
        const store = tx.objectStore("Products");
        Promise.all(sampleProducts.map(product => store.add(product)))
            .then(() => tx.complete)
            .then(() => {
                renderProducts();
                alert("Sample products added successfully!");
            })
            .catch(err => {
                tx.abort();
                console.error(err);
                alert("Error adding products: " + err.message);
            });
    });
};

document.getElementById("ordBtn").onclick = function () {
    promiseDB.then(function (DB) {
        const tx = DB.transaction("Orders", "readwrite");
        const store = tx.objectStore("Orders");
        Promise.all(sampleOrders.map(order => store.add(order)))
            .then(() => tx.complete)
            .then(() => {
                renderOrders();
                alert("Sample orders added successfully!");
            })
            .catch(err => {
                tx.abort();
                console.error(err);
                alert("Error adding orders: " + err.message);
            });
    });
};

async function getProductByName(productName) {
    const DB = await promiseDB;
    const tx = DB.transaction("Products", "readonly");
    const store = tx.objectStore("Products");
    const index = store.index("name");
    const product = await index.get(productName);
    return product || null;
}

document.getElementById("searchBtn").onclick = async function () {
    const productName = document.getElementById("prdName").value.trim();
    const resultDiv = document.getElementById("searchResult");
    if (!productName) {
        resultDiv.innerHTML = '<div class="msg-error">Please enter a product name</div>';
        return;
    }

    const product = await getProductByName(productName);
    if (product) {
        resultDiv.innerHTML = `
            <div class="list-row"><span><strong>${product.name}</strong></span><span>$${product.price.toFixed(2)}</span></div>
            <div class="list-row"><span class="meta-key">Color:</span><span class="meta-val">${product.color}</span></div>
            <div class="list-row"><span class="meta-key">Material:</span><span class="meta-val">${product.material}</span></div>
            <div class="list-row"><span class="meta-key">Stock:</span><span class="meta-val">${product.stock} units</span></div>
        `;
    } else {
        resultDiv.innerHTML = `<div class="msg-error">Product "${productName}" not found</div>`;
    }
};

document.getElementById("addOrderBtn").onclick = async function () {
    const productName = document.getElementById("orderName").value.trim();
    const quantity = parseInt(document.getElementById("orderQty").value);
    const statusDiv = document.getElementById("orderStatus");
    
    if (!productName || quantity < 1) {
        statusDiv.textContent = "Please enter a valid product name and quantity";
        statusDiv.className = "err";
        return;
    }

    const product = await getProductByName(productName);
    if (!product) {
        statusDiv.textContent = `Product "${productName}" not found`;
        statusDiv.className = "err";
        return;
    }
    if (product.stock < quantity) {
        statusDiv.textContent = `Insufficient stock. Available: ${product.stock}`;
        statusDiv.className = "err";
        return;
    }

    try {
        const DB = await promiseDB;
        const tx = DB.transaction("Orders", "readwrite");
        const orderStore = tx.objectStore("Orders");

        await orderStore.add({
            productName: product.name,
            quantity,
            price: product.price,
            color: product.color,
            material: product.material
        });

        await tx.complete;
        statusDiv.textContent = `Order placed successfully for ${quantity}x ${product.name}`;
        statusDiv.className = "ok";
        document.getElementById("orderName").value = "";
        document.getElementById("orderQty").value = "1";
        renderOrders();
    } catch (err) {
        console.error(err);
        statusDiv.textContent = "Error placing order";
        statusDiv.className = "err";
    }
};

async function updateProductStock(productId, newStock) {
    const DB = await promiseDB;
    const tx = DB.transaction("Products", "readwrite");
    const store = tx.objectStore("Products");
    const product = await store.get(productId);
    if (product) {
        product.stock = newStock;
        await store.put(product);
    }
    await tx.complete;
}

async function getAllProducts() {
    const DB = await promiseDB;
    return await DB.transaction("Products", "readonly").objectStore("Products").getAll();
}

async function getAllOrders() {
    const DB = await promiseDB;
    return await DB.transaction("Orders", "readonly").objectStore("Orders").getAll();
}

async function deleteOrder(orderId) {
    const DB = await promiseDB;
    const tx = DB.transaction("Orders", "readwrite");
    await tx.objectStore("Orders").delete(orderId);
    await tx.complete;
}

async function deleteSingleOrder(orderId) {
    try {
        await deleteOrder(orderId);
        renderOrders();
    } catch (err) {
        console.error(err);
        alert("Error deleting order");
    }
}

document.getElementById("applyOrdersBtn").onclick = async function () {
    const resultsDiv = document.getElementById("applyResults");
    resultsDiv.innerHTML = "Processing orders...";
    try {
        const orders = await getAllOrders();
        if (orders.length === 0) {
            resultsDiv.innerHTML = '<div class="text-ok">No orders to apply</div>';
            return;
        }

        let successCount = 0, errorCount = 0, resultsHTML = "";

        for (const order of orders) {
            const product = await getProductByName(order.productName);
            if (!product) {
                errorCount++;
                resultsHTML += `<div class="apply-row"><span class="item-name">${order.productName}</span><span class="text-err">Product not found</span></div>`;
                continue;
            }
            if (product.stock < order.quantity) {
                errorCount++;
                resultsHTML += `<div class="apply-row"><span class="item-name">${order.productName}</span><span class="text-err">Insufficient stock (${product.stock} available)</span></div>`;
                continue;
            }

            await updateProductStock(product.id, product.stock - order.quantity);
            await deleteOrder(order.orderId); 
            successCount++;
            resultsHTML += `<div class="apply-row"><span class="item-name">${order.productName}</span><span class="text-ok">Applied (${order.quantity} units)</span></div>`;
        }

        resultsDiv.innerHTML = `<div style="margin-bottom:10px;font-weight:600;">Results: ${successCount} successful, ${errorCount} failed</div>${resultsHTML}`;
        renderProducts();
        renderOrders();
    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = '<div class="text-err">Error applying orders</div>';
    }
};

async function renderProducts() {
    const tbody = document.getElementById("productsTbody");
    try {
        const products = await getAllProducts();
        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No products available</td></tr>`;
            return;
        }
        tbody.innerHTML = products.map(p => {
            let stockClass = "stock-badge";
            if (p.stock === 0) stockClass += " empty";
            else if (p.stock < 10) stockClass += " low";
            return `<tr><td>${p.name}</td><td>${p.id}</td><td>$${p.price.toFixed(2)}</td><td>${p.color}</td><td>${p.material}</td><td><span class="${stockClass}">${p.stock}</span></td></tr>`;
        }).join("");
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Error loading products</td></tr>`;
    }
}

async function renderOrders() {
    const tbody = document.getElementById("ordersTbody");
    try {
        const orders = await getAllOrders();
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No orders pending</td></tr>`;
            return;
        }
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>${o.productName}</td><td>${o.orderId}</td><td>$${o.price.toFixed(2)}</td>
                <td>${o.color}</td><td>${o.material}</td><td>${o.quantity}</td>
                <td><button class="btn-sm btn-danger" onclick="deleteSingleOrder(${o.orderId})">Delete</button></td>
            </tr>`).join("");
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error loading orders</td></tr>`;
    }
}

window.onload = async function () {
    try {
        await promiseDB;
        renderProducts();
        renderOrders();
    } catch (err) {
        console.error("Failed to initialize database:", err);
        alert("Failed to initialize database: " + err.message);
    }
};