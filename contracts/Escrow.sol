// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISupplyChain {
    function getProduct(uint256 _productId)
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            address
        );
}

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
    mapping(uint256 => uint256) public productToTxn;

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

    function setSupplyChain(address _supplyChain) external onlyOwner {
        require(_supplyChain != address(0), "Invalid SupplyChain");
        supplyChain = _supplyChain;
        emit SupplyChainSet(_supplyChain);
    }

    function createTransaction(uint256 _productId, address _seller) external {
        require(supplyChain != address(0), "SupplyChain not set");
        require(_productId > 0, "Invalid product ID");
        require(_seller != address(0), "Invalid seller");
        require(productToTxn[_productId] == 0, "Already exists");
        require(msg.sender != _seller, "Buyer and seller same");

        (, , , address currentOwner) = ISupplyChain(supplyChain).getProduct(_productId);
        require(currentOwner == _seller, "Seller is not current owner");

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

    function releasePayment(uint256 _productId) external onlySupplyChain {
        uint256 txnId = productToTxn[_productId];
        require(txnId != 0, "Transaction not found");

        Transaction storage txn = transactions[txnId];

        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");
        require(txn.amount > 0, "No funds deposited");

        txn.status = Status.COMPLETE;

        uint256 amount = txn.amount;
        txn.amount = 0;

        (bool success, ) = payable(txn.seller).call{value: amount}("");
        require(success, "Payment transfer failed");

        emit PaymentReleased(txnId);
    }

    function refund(uint256 _productId) external onlyOwner {
        uint256 txnId = productToTxn[_productId];
        require(txnId != 0, "Transaction not found");

        Transaction storage txn = transactions[txnId];

        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");

        uint256 amount = txn.amount;
        require(amount > 0, "No funds deposited");

        txn.status = Status.REFUNDED;
        txn.amount = 0;

        (bool success, ) = payable(txn.buyer).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit Refunded(txnId);
    }

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

    function getTransactionIdByProduct(uint256 _productId)
        external
        view
        returns (uint256)
    {
        return productToTxn[_productId];
    }
}