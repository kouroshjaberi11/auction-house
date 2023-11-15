/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_KEY: "NFTStorage API Key",
        API_URL: "Sepolia URL",
        PRIVATE_KEY: "My private key",
        NFTCOLLECTION_CONTRACT: "0xf436a2f5DDCBB1AB1C47Aee3C6a08979b8744aFd",
        COIN_CONTRACT: "0x5F7457165C371BfB829618C78235D854905B5c47",
        AH_CONTRACT: "0x9318910674B1DAAdb3aE52d76bDa00EcaDf0Ec0f"
    }
}

module.exports = nextConfig
