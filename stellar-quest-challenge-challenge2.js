const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = require('stellar-sdk')
const { filter, find } = require('lodash')
const BigNumber = require('bignumber.js')

const parseError = require('@runkit/tyvdh/parse-error/2.0.0')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()
    
    await server.loadAccount(myPublicKey)
    .then(async (account) => {
        const { records } = await account.operations({order: 'desc', limit: 200})
        const paymentOps = filter(records, (operation) => operation.type === 'payment')
        const successOp = find(paymentOps, (operation) => 
            operation.to !== myPublicKey
            && new BigNumber(operation.amount).eq(10)
        )
        
        if (successOp)
            return
    
        console.log('Account exists and is ready to send a payment')
    
        const friendbotKeypair = Keypair.random()
        const friendbotPublicKey = friendbotKeypair.publicKey()
        
        await server
        .friendbot(friendbotPublicKey)
        .call()
        .then(() => console.log('Random friendbot account was successfully funded'))
    
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.payment({
            destination: friendbotPublicKey,
            asset: Asset.native(),
            amount: '10'
        }))
        .setTimeout(0)
        .build()

        transaction.sign(myKeypair)

        console.log('Payment transaction has been prepared and signed')
        return server.submitTransaction(transaction)
    })
    .then(() => console.log('Payment transaction was successfully submitted!'))
}

catch(err) {
    console.error(parseError(err))
}
