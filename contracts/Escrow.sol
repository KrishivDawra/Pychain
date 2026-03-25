// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {

    enum Status { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, REFUNDED }

    struct Transaction {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    uint256 public transactionCount;

    mapping(uint256 => Transaction) public transactions;

    event TransactionCreated(uint256 id, address buyer, address seller, uint256 amount);
    event PaymentDeposited(uint256 id);
    event PaymentReleased(uint256 id);
    event Refunded(uint256 id);

    // ✅ Create Escrow Transaction
    function createTransaction(address _seller) public {
        transactionCount++;

        transactions[transactionCount] = Transaction({
            id: transactionCount,
            buyer: msg.sender,
            seller: _seller,
            amount: 0,
            status: Status.AWAITING_PAYMENT
        });

        emit TransactionCreated(transactionCount, msg.sender, _seller, 0);
    }

    // ✅ Deposit Payment
    function depositPayment(uint256 _id) public payable {
        Transaction storage txn = transactions[_id];

        require(msg.sender == txn.buyer, "Only buyer can pay");
        require(txn.status == Status.AWAITING_PAYMENT, "Invalid state");
        require(msg.value > 0, "Amount must be > 0");

        txn.amount = msg.value;
        txn.status = Status.AWAITING_DELIVERY;

        emit PaymentDeposited(_id);
    }

    // ✅ Confirm Delivery → Release Payment
    function confirmDelivery(uint256 _id) public {
        Transaction storage txn = transactions[_id];

        require(msg.sender == txn.buyer, "Only buyer can confirm");
        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");

        txn.status = Status.COMPLETE;

        payable(txn.seller).transfer(txn.amount);

        emit PaymentReleased(_id);
    }

    // ✅ Refund Buyer
    function refund(uint256 _id) public {
        Transaction storage txn = transactions[_id];

        require(msg.sender == txn.seller, "Only seller can refund");
        require(txn.status == Status.AWAITING_DELIVERY, "Invalid state");

        txn.status = Status.REFUNDED;

        payable(txn.buyer).transfer(txn.amount);

        emit Refunded(_id);
    }

    // ✅ Get Transaction Details
    function getTransaction(uint256 _id) public view returns (
        uint256,
        address,
        address,
        uint256,
        Status
    ) {
        Transaction memory txn = transactions[_id];
        return (txn.id, txn.buyer, txn.seller, txn.amount, txn.status);
    }
}