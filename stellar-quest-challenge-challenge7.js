const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')
const { chain, find } = require('lodash')
const BigNubmer = require('bignumber.js')
const Promise = require('bluebird')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()

    const isCompleted = !!await server.loadAccount(myPublicKey)
    .then((account) => account.transactions({order: 'desc', limit: 200}))
    .then(async ({records}) => await Promise.map(records, (record) => {
        if (record.source_account !== myPublicKey)
            return record.operations()
    })
    .then((operations) => chain(operations)
        .compact()
        .map('records')
        .flatten()
        .find({type: 'payment', from: myPublicKey})
        .value()
    ))

    if (isCompleted)
        return console.log(`Account has already made a channel account payment`)
    
    const channelKeypair = Keypair.random()
    const channelPublicKey = channelKeypair.publicKey()

    await server
    .friendbot(channelPublicKey)
    .call()
    .then(() => console.log('Random channel account was successfully funded'))
    
    await server.loadAccount(channelPublicKey)
    .then(async (account) => {
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.payment({
            destination: channelPublicKey,
            source: myPublicKey,
            asset: Asset.native(),
            amount: '10'
        }))
        .setTimeout(0)
        .build()

        transaction.sign(channelKeypair)
        transaction.sign(myKeypair)

        console.log('Channel account payment transaction has been prepared and signed')
        await server.submitTransaction(transaction)
        console.log('Channel account payment transaction was successfully submitted')
    })
}

catch(err) {
    console.error(parseError(err))
}
