const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')
const { find } = require('lodash')
const BigNumber = require('bignumber.js')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()
    
    await server.loadAccount(myPublicKey)
    .then(async (account) => {
        if (find(
            account.balances, 
            (asset) => asset.asset_type !== 'native' && new BigNumber(asset.balance).gt(0)
        )) return console.log('Account has already accepted and received a custom asset')
    
        console.log('Account exists and is ready to receive custom asset')
    
        const issuerKeypair = Keypair.random()
        const issuerPublicKey = issuerKeypair.publicKey()

        await server
        .friendbot(issuerPublicKey)
        .call()
        .then(() => console.log('Random issuer account was successfully funded'))
        
        const HUG = new Asset('HUG', issuerPublicKey)
    
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.changeTrust({
            asset: HUG
        }))
        .addOperation(Operation.payment({
            asset: HUG,
            amount: '100',
            destination: myPublicKey,
            source: issuerPublicKey
        }))
        .setTimeout(0)
        .build()

        transaction.sign(myKeypair)
        transaction.sign(issuerKeypair)

        console.log('Custom asset transaction has been prepared and signed')
        await server.submitTransaction(transaction)
        console.log('Custom asset transaction was successfully submitted')
    })
}

catch(err) {
    console.error(parseError(err))
}
