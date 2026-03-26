// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// 🔗 Escrow Interface
interface IEscrow {
    function releasePayment(uint256 productId) external;
}

contract SupplyChain is AccessControl {

    // ✅ ROLES
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR");
    bytes32 public constant WHOLESALER_ROLE = keccak256("WHOLESALER");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER");

    // 🔗 Escrow contract
    IEscrow public escrow;

    struct Product {
        uint256 id;
        string name;
        string metadataHash;
        address currentOwner;
        bool exists;
    }

    struct Ownership {
        address owner;
        uint256 timestamp;
    }

    struct ProductEvent {
        string action;
        address actor;
        uint256 timestamp;
    }

    uint256 public productCount;

    mapping(uint256 => Product) public products;
    mapping(uint256 => Ownership[]) public productHistory;
    mapping(uint256 => ProductEvent[]) public productEvents;

    event ProductRegistered(uint256 productId, address manufacturer);
    event OwnershipTransferred(uint256 productId, address from, address to);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    // 🔗 SET ESCROW
    function setEscrow(address _escrow) public onlyRole(DEFAULT_ADMIN_ROLE) {
        escrow = IEscrow(_escrow);
    }

    // 🔥 Timeline
    function addEvent(uint256 productId, string memory action) internal {
        productEvents[productId].push(
            ProductEvent(action, msg.sender, block.timestamp)
        );
    }

    // ✅ REGISTER
    function registerProduct(string memory _name, string memory _metadataHash)
        public
        onlyRole(MANUFACTURER_ROLE)
    {
        productCount++;

        products[productCount] = Product({
            id: productCount,
            name: _name,
            metadataHash: _metadataHash,
            currentOwner: msg.sender,
            exists: true
        });

        productHistory[productCount].push(
            Ownership(msg.sender, block.timestamp)
        );

        addEvent(productCount, "Product Created by Manufacturer");

        emit ProductRegistered(productCount, msg.sender);
    }

    // 🔄 ROLE FLOW
    function transferProduct(uint256 _productId, address _to) public {
        require(products[_productId].exists, "Product does not exist");
        require(products[_productId].currentOwner == msg.sender, "Not owner");

        if (hasRole(MANUFACTURER_ROLE, msg.sender)) {
            require(hasRole(DISTRIBUTOR_ROLE, _to), "Only Distributor");
        } 
        else if (hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            require(hasRole(WHOLESALER_ROLE, _to), "Only Wholesaler");
        } 
        else if (hasRole(WHOLESALER_ROLE, msg.sender)) {
            require(hasRole(RETAILER_ROLE, _to), "Only Retailer");
        }

        address previousOwner = products[_productId].currentOwner;

        products[_productId].currentOwner = _to;

        productHistory[_productId].push(
            Ownership(_to, block.timestamp)
        );

        addEvent(_productId, "Ownership Transferred");

        emit OwnershipTransferred(_productId, previousOwner, _to);
    }

    // 🚚 SHIP
    function markShipped(uint256 _productId) public {
        require(products[_productId].exists, "Product does not exist");
        require(products[_productId].currentOwner == msg.sender, "Not owner");
        require(hasRole(DISTRIBUTOR_ROLE, msg.sender), "Only Distributor");

        addEvent(_productId, "Product Shipped");
    }

    // 📦 DELIVER + 💰 AUTO PAYMENT
    function markDelivered(uint256 _productId) public {
        require(products[_productId].exists, "Product does not exist");
        require(products[_productId].currentOwner == msg.sender, "Not owner");
        require(hasRole(RETAILER_ROLE, msg.sender), "Only Retailer");

        addEvent(_productId, "Product Delivered");

        // 💰 AUTO RELEASE PAYMENT
        if (address(escrow) != address(0)) {
            escrow.releasePayment(_productId);
        }
    }

    // 📦 GET PRODUCT
    function getProduct(uint256 _productId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            address
        )
    {
        require(products[_productId].exists, "Product does not exist");

        Product memory p = products[_productId];
        return (p.id, p.name, p.metadataHash, p.currentOwner);
    }

    // 📜 HISTORY
    function getProductHistory(uint256 _productId)
        public
        view
        returns (Ownership[] memory)
    {
        return productHistory[_productId];
    }

    // 📊 TIMELINE
    function getProductEvents(uint256 _productId)
        public
        view
        returns (ProductEvent[] memory)
    {
        return productEvents[_productId];
    }

    // 🔍 VERIFY
    function verifyProduct(uint256 _productId, string memory _metadataHash)
        public
        view
        returns (bool)
    {
        require(products[_productId].exists, "Product does not exist");

        return keccak256(bytes(products[_productId].metadataHash)) ==
            keccak256(bytes(_metadataHash));
    }
}