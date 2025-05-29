
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YapToken is ERC20, Ownable {
    constructor() ERC20("Yap Token", "YAP") {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

contract YapMinter is Ownable {
    YapToken public yapToken;
    
    // Mapping to track last mint timestamp for each user
    mapping(address => uint256) public lastMintTimestamp;
    
    // Base rate for token calculation
    uint256 public constant BASE_RATE = 10;
    
    // Cooldown period (24 hours)
    uint256 public constant COOLDOWN_PERIOD = 24 hours;
    
    event TokensMinted(
        address indexed user,
        string twitterUsername,
        uint256 yapsL24h,
        uint256 tokenAmount
    );
    
    constructor(address _yapToken) {
        yapToken = YapToken(_yapToken);
    }
    
    /**
     * @dev Mint YAP tokens based on Twitter Yaps score
     * @param twitterUsername The Twitter username
     * @param yapsL24h The 24-hour Yaps score from Kaito API
     */
    function mintYaps(string memory twitterUsername, uint256 yapsL24h) external {
        require(bytes(twitterUsername).length > 0, "Twitter username required");
        require(yapsL24h > 0, "Yaps score must be positive");
        
        // Check cooldown period
        require(
            block.timestamp >= lastMintTimestamp[msg.sender] + COOLDOWN_PERIOD,
            "Must wait 24 hours between mints"
        );
        
        // Calculate token amount: baseRate * log2(1 + yaps_l24h)
        uint256 tokenAmount = calculateTokenAmount(yapsL24h);
        require(tokenAmount > 0, "Token amount must be positive");
        
        // Update last mint timestamp
        lastMintTimestamp[msg.sender] = block.timestamp;
        
        // Mint tokens to user
        yapToken.mint(msg.sender, tokenAmount * 1e18); // Convert to wei
        
        emit TokensMinted(msg.sender, twitterUsername, yapsL24h, tokenAmount);
    }
    
    /**
     * @dev Calculate token amount based on Yaps score
     * @param yapsL24h The 24-hour Yaps score
     * @return tokenAmount The calculated token amount
     */
    function calculateTokenAmount(uint256 yapsL24h) public pure returns (uint256) {
        if (yapsL24h == 0) return 0;
        
        // Simplified log2 calculation for Solidity
        // This is an approximation of: BASE_RATE * log2(1 + yapsL24h)
        uint256 adjustedYaps = yapsL24h + 1;
        uint256 logValue = 0;
        
        // Calculate log2 approximation
        while (adjustedYaps > 1) {
            adjustedYaps = adjustedYaps / 2;
            logValue++;
        }
        
        return BASE_RATE * logValue;
    }
    
    /**
     * @dev Check if user can mint (cooldown period passed)
     * @param user The user address to check
     * @return canMint Whether the user can mint
     */
    function canUserMint(address user) external view returns (bool) {
        return block.timestamp >= lastMintTimestamp[user] + COOLDOWN_PERIOD;
    }
    
    /**
     * @dev Get time until next mint for a user
     * @param user The user address to check
     * @return timeUntilMint Seconds until next mint (0 if can mint now)
     */
    function timeUntilNextMint(address user) external view returns (uint256) {
        uint256 nextMintTime = lastMintTimestamp[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= nextMintTime) {
            return 0;
        }
        return nextMintTime - block.timestamp;
    }
    
    /**
     * @dev Emergency function to update YAP token address
     * @param _yapToken New YAP token address
     */
    function updateYapToken(address _yapToken) external onlyOwner {
        yapToken = YapToken(_yapToken);
    }
}
