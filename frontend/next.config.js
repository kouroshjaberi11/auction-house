/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQxQzAxNjRBZTQwMkMwNWY4OGE3MkUyM2I5NUVmZURhYTcyZjA0YTQiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5OTQ1NTE0MDQ2OCwibmFtZSI6IlAyIn0.FQs6HXoGq4deGv_lO0ElCHDV2_9Izl9HFZiQTLOgJzM",
        API_URL: "https://eth-sepolia.g.alchemy.com/v2/mN6co7qEg4SbbstEVxuN8pFQNvD1FYh6",
        PRIVATE_KEY: "e9b790d31f343e0ea4011c68a39d5758ae62b56173048eb18f7558d3820de5c4",
        NFTCOLLECTION_CONTRACT: "0xAd5a802bFd39F4677734c58f27299637D422ACCc",
        COIN_CONTRACT: "0x5F7457165C371BfB829618C78235D854905B5c47",
        AH_CONTRACT: "0x692C69eB2d0E0B1E42e86BbbdD9ff552f83497Be"
    }
}

module.exports = nextConfig