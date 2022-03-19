require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const http = require('http')
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const moment = require('moment-timezone')
const numeral = require('numeral')
const _ = require('lodash')
const axios = require('axios')

// SERVER CONFIG
const PORT = process.env.PORT || 5000
const app = express();
const server = http.createServer(app).listen(PORT, () => console.log(`Listening on ${PORT}`, '\n'))

// AVAX MAINNET RPC URL
// const RPC_URL = "https://api.avax.network/ext/bc/C/rpc"

// AVAX TESTNET RPC URL
// const RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc"

const burnAddress = "0x0000000000000000000000000000000000000000";

// WEB3 CONFIG
const web3 = new Web3(new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL) )

const wallet = process.env.ACCOUNT

async function burnAvax(amount) {    
    // Transaction Settings
    const gasPrice = await web3.eth.getGasPrice()
    const gasCost = Number(gasPrice) * 21000
    const realAmount = Number(amount) - gasCost
    const SETTINGS = {
      gas: 21000,
      gasPrice: gasPrice,
      from: wallet, // Use your account here
      to: burnAddress,
      value: realAmount,
    }
  
    // Burn Avax
    console.log('Burning Avax tokens...')
    const result = await web3.eth.sendTransaction(SETTINGS)
    console.log(`Burn Successful: https://snowtrace.io/tx/${result.transactionHash}`, '\n')
}

let balanceMonitor
let monitoringBalance = false

async function monitorBalance() {
    if (monitoringBalance) {
        return
    }

    console.log("Checking balance...", '\n')
    monitoringBalance = true

    try {

        const adminWalletBalance = await web3.eth.getBalance(wallet)
        const amountToBurn = web3.utils.fromWei(adminWalletBalance, 'Ether')
        const burn = Number(amountToBurn)
        console.log('Amount of AVAX tokens to Burn: ', burn, '\n')
        const gp = await web3.eth.getGasPrice()
        const gc = Number(gp) * 21000
        const gCost = web3.utils.fromWei(gc.toString(), 'Ether')
        if (burn > Number(gCost)) {
            // burn the tokens
            await burnAvax(adminWalletBalance)
        }

    } catch (error) {
        console.error(error)
        monitoringBalance = false
        clearInterval(balanceMonitor)
        return
    }
    monitoringBalance = false
}

// Check wallet balance every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 1000 // 1 Second(s)
balanceMonitor = setInterval(async () => { await monitorBalance() }, POLLING_INTERVAL)