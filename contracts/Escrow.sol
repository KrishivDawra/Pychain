// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    enum Status {
        AWAITING_PAYMENT,
        AWAITING_DELIVERY,
        COMPLETE,
        REFUNDED
    }

    struct Transaction {
        uint256 id;
        uint256 productId;
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    uint256 public transactionCount;
    address public supplyChain;
    address public owner;

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => uint256) public productToTxn; // productId => txnId

    event SupplyChainSet(address indexed supplyChain);
    event TransactionCreated(
        uint256 indexed id,
        uint256 indexed productId,
        address indexed buyer,
        address seller
    );
    event PaymentDeposited(uint256 indexed id, uint256 amount);
    event PaymentReleased(uint256 indexed id);
    event Refunded(uint256 indexed id);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySupplyChain() {
        require(msg.sender == supplyChain, "Only SupplyChain");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 🔗 CONNECT SUPPLYCHAIN
    function setSupplyChain(address _supplyChain) external onlyOwner {
        require(_supplyChain != address(0), "Invalid SupplyChain");
        require(supplyChain == address(0), "Already set");

        supplyChain = _supplyChain;
        emit SupplyChainSet(_supplyChain);
    }

    // ✅ CREATE TRANSACTION
    function createTransaction(uint256 _productId, address _seller) external {
        require(_productId > 0, "Invalid product ID");
        require(_seller != address(0), "Invalid seller");
        require(productToTxn[_productId] == 0, "Already exists");
        require(msg.sender != _seller, "Buyer and seller same");

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

        emit TransactionCreated(
            transactionCount,
            _productId,
            msg.sender,
            _seller
        );
    }

    // 💰 DEPOSIT PAYMENT
    function depositPayment(uint256 _productId) external payable {
        uint256 txnId = productToTxn[_productId];
        require(txnId != 0, "Transaction not found");

        Transaction storage txn = transactions[txnId];

        require(msg.sender == txn.buyer, "Only buyer");
        require(txn.status == Status.AWAITING_PAYMENT, "Invalid state");
        require(msg.value > 0, "Amount > 0");
        require(txn.amount == 0, "Already funded");

        txn.amount = msg.value;
        txn.status = Status.AWAITING_DELIVERY;

        emit PaymentDeposited(txnId, msg.value);
    }

    // 💰 AUTO RELEASE (CALLED BY SUPPLYCHAIN)
    function releasePayment(uint256 _productId) external onlySupplyChain {
        uint256 txnId = productToTxn[_productId];
        require(txnId != 0, "Transaction not found");

        Transaction storage txn = transactions[txnId];

        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");
        require(txn.amount > 0, "No funds deposited");

        txn.status = Status.COMPLETE;

        payable(txn.seller).transfer(txn.amount);

        emit PaymentReleased(txnId);
    }

    // 🔁 REFUND
    function refund(uint256 _productId) external {
        uint256 txnId = productToTxn[_productId];
        require(txnId != 0, "Transaction not found");

        Transaction storage txn = transactions[txnId];

        require(msg.sender == txn.seller, "Only seller");
        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");
        require(txn.amount > 0, "No funds deposited");

        txn.status = Status.REFUNDED;

        payable(txn.buyer).transfer(txn.amount);

        emit Refunded(txnId);
    }

    // 👀 VIEW
    function getTransaction(uint256 _productId)
        external
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
        require(txnId != 0, "Transaction not found");

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

    // ✅ Helper for frontend
    function getTransactionIdByProduct(uint256 _productId)
        external
        view
        returns (uint256)
    {
        return productToTxn[_productId];
    }
}