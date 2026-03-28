// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Escrow interface
interface IEscrow {
    function releasePayment(uint256 productId) external;
}

contract SupplyChain is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR");
    bytes32 public constant WHOLESALER_ROLE = keccak256("WHOLESALER");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER");

    IEscrow public escrow;

    struct Product {
        uint256 id;
        string name;
        string metadataHash;
        address currentOwner;
        bool exists;
        bool shipped;
        bool delivered;
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

    event ProductRegistered(uint256 indexed productId, address indexed manufacturer);
    event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event EscrowUpdated(address indexed escrowAddress);
    event ProductShipped(uint256 indexed productId, address indexed distributor);
    event ProductDelivered(uint256 indexed productId, address indexed retailer);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    function setEscrow(address _escrow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_escrow != address(0), "Invalid escrow address");
        escrow = IEscrow(_escrow);
        emit EscrowUpdated(_escrow);
    }

    function addEvent(uint256 productId, string memory action) internal {
        productEvents[productId].push(
            ProductEvent(action, msg.sender, block.timestamp)
        );
    }

    function _requireProductExists(uint256 _productId) internal view {
        require(products[_productId].exists, "Product does not exist");
    }

    function registerProduct(
        string memory _name,
        string memory _metadataHash
    ) external onlyRole(MANUFACTURER_ROLE) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_metadataHash).length > 0, "Metadata required");

        productCount++;

        products[productCount] = Product({
            id: productCount,
            name: _name,
            metadataHash: _metadataHash,
            currentOwner: msg.sender,
            exists: true,
            shipped: false,
            delivered: false
        });

        productHistory[productCount].push(
            Ownership(msg.sender, block.timestamp)
        );

        addEvent(productCount, "Product Created by Manufacturer");
        emit ProductRegistered(productCount, msg.sender);
    }

    function transferProduct(uint256 _productId, address _to) external {
        _requireProductExists(_productId);
        require(_to != address(0), "Invalid recipient");

        Product storage product = products[_productId];

        require(product.currentOwner == msg.sender, "Not owner");
        require(!product.delivered, "Already delivered");
        require(msg.sender != _to, "Cannot transfer to self");

        if (hasRole(MANUFACTURER_ROLE, msg.sender)) {
            require(hasRole(DISTRIBUTOR_ROLE, _to), "Only Distributor");
        } else if (hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            require(hasRole(WHOLESALER_ROLE, _to), "Only Wholesaler");
        } else if (hasRole(WHOLESALER_ROLE, msg.sender)) {
            require(hasRole(RETAILER_ROLE, _to), "Only Retailer");
        } else {
            revert("Unauthorized transfer role");
        }

        address previousOwner = product.currentOwner;
        product.currentOwner = _to;

        productHistory[_productId].push(Ownership(_to, block.timestamp));
        addEvent(_productId, "Ownership Transferred");

        emit OwnershipTransferred(_productId, previousOwner, _to);
    }

    function markShipped(uint256 _productId) external {
        _requireProductExists(_productId);

        Product storage product = products[_productId];

        require(product.currentOwner == msg.sender, "Not owner");
        require(hasRole(DISTRIBUTOR_ROLE, msg.sender), "Only Distributor");
        require(!product.shipped, "Already shipped");
        require(!product.delivered, "Already delivered");

        product.shipped = true;

        addEvent(_productId, "Product Shipped");
        emit ProductShipped(_productId, msg.sender);
    }

    function markDelivered(uint256 _productId) external {
        _requireProductExists(_productId);

        Product storage product = products[_productId];

        require(product.currentOwner == msg.sender, "Not owner");
        require(hasRole(RETAILER_ROLE, msg.sender), "Only Retailer");
        require(product.shipped, "Product not shipped");
        require(!product.delivered, "Already delivered");
        require(address(escrow) != address(0), "Escrow not set");

        product.delivered = true;

        addEvent(_productId, "Product Delivered");
        emit ProductDelivered(_productId, msg.sender);

        escrow.releasePayment(_productId);
    }

    function getProduct(uint256 _productId)
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            address
        )
    {
        _requireProductExists(_productId);
        Product memory p = products[_productId];
        return (p.id, p.name, p.metadataHash, p.currentOwner);
    }

    function getProductDetails(uint256 _productId)
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            address,
            bool,
            bool
        )
    {
        _requireProductExists(_productId);

        Product memory p = products[_productId];
        return (
            p.id,
            p.name,
            p.metadataHash,
            p.currentOwner,
            p.shipped,
            p.delivered
        );
    }

    function getProductHistory(uint256 _productId)
        external
        view
        returns (Ownership[] memory)
    {
        _requireProductExists(_productId);
        return productHistory[_productId];
    }

    function getProductEvents(uint256 _productId)
        external
        view
        returns (ProductEvent[] memory)
    {
        _requireProductExists(_productId);
        return productEvents[_productId];
    }

    function verifyProduct(uint256 _productId, string memory _metadataHash)
        external
        view
        returns (bool)
    {
        _requireProductExists(_productId);

        return
            keccak256(bytes(products[_productId].metadataHash)) ==
            keccak256(bytes(_metadataHash));
    }

    function escrowAddress() external view returns (address) {
        return address(escrow);
    }
}