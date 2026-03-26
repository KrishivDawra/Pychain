// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {

    enum Status { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, REFUNDED }

    struct Transaction {
        uint256 id;
        uint256 productId;   // 🔥 LINK WITH SUPPLYCHAIN
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    uint256 public transactionCount;

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => uint256) public productToTxn; // 🔥 productId → txnId

    address public supplyChain; // 🔥 authorized contract

    event TransactionCreated(uint256 id, uint256 productId, address buyer, address seller);
    event PaymentDeposited(uint256 id, uint256 amount);
    event PaymentReleased(uint256 id);
    event Refunded(uint256 id);

    modifier onlySupplyChain() {
        require(msg.sender == supplyChain, "Only SupplyChain");
        _;
    }

    // 🔗 CONNECT SUPPLYCHAIN
    function setSupplyChain(address _supplyChain) public {
        require(supplyChain == address(0), "Already set");
        supplyChain = _supplyChain;
    }

    // ✅ CREATE TRANSACTION (LINKED TO PRODUCT)
    function createTransaction(uint256 _productId, address _seller) public {
        require(productToTxn[_productId] == 0, "Already exists");

        transactionCount++;

        transactions[transactionCount] = Transaction({
            id: transactionCount,
            productId: _productId,
            buyer: msg.sender,
            seller: _seller,
            amount: 0,
            status: Status.AWAITING_PAYMENT
        });

        productToTxn[_productId] = transactionCount;

        emit TransactionCreated(transactionCount, _productId, msg.sender, _seller);
    }

    // 💰 DEPOSIT PAYMENT
    function depositPayment(uint256 _productId) public payable {
        uint256 txnId = productToTxn[_productId];
        Transaction storage txn = transactions[txnId];

        require(msg.sender == txn.buyer, "Only buyer");
        require(txn.status == Status.AWAITING_PAYMENT, "Invalid state");
        require(msg.value > 0, "Amount > 0");

        txn.amount = msg.value;
        txn.status = Status.AWAITING_DELIVERY;

        emit PaymentDeposited(txnId, msg.value);
    }

    // 💰 AUTO RELEASE (CALLED BY SUPPLYCHAIN)
    function releasePayment(uint256 _productId) public onlySupplyChain {
        uint256 txnId = productToTxn[_productId];
        Transaction storage txn = transactions[txnId];

        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");

        txn.status = Status.COMPLETE;

        payable(txn.seller).transfer(txn.amount);

        emit PaymentReleased(txnId);
    }

    // 🔁 REFUND (SELLER SIDE)
    function refund(uint256 _productId) public {
        uint256 txnId = productToTxn[_productId];
        Transaction storage txn = transactions[txnId];

        require(msg.sender == txn.seller, "Only seller");
        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");

        txn.status = Status.REFUNDED;

        payable(txn.buyer).transfer(txn.amount);

        emit Refunded(txnId);
    }

    // 👀 VIEW
    function getTransaction(uint256 _productId)
        public
        view
        returns (
            uint256,
            uint256,
            address,
            address,
            uint256,
            Status
        )
    {
        uint256 txnId = productToTxn[_productId];
        Transaction memory txn = transactions[txnId];

        return (
            txn.id,
            txn.productId,
            txn.buyer,
            txn.seller,
            txn.amount,
            txn.status
        );
    }
}