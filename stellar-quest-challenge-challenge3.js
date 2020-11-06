const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()
    
    await server.loadAccount(myPublicKey)
    .then(async (account) => {
        console.log('Account exists and is ready to set account data')
    
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.manageData({
            name: 'Hello',
            value: 'World'
        }))
        .setTimeout(0)
        .build()

        transaction.sign(myKeypair)

        console.log('Manage data transaction has been prepared and signed')
        return server.submitTransaction(transaction)
    })
    .then(() => console.log('Manage data transaction was successfully submitted!'))
}

catch(err) {
    console.error(parseError(err))
}
