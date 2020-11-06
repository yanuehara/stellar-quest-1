const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')
const { find } = require('lodash')
const BigNubmer = require('bignumber.js')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()
    
    await server.loadAccount(myPublicKey)
    .then(async (account) => {
        const customAsset = find(
            account.balances, 
            (asset) => asset.asset_type !== 'native' && new BigNubmer(asset.balance).gt(0)
        )
        
        if (!customAsset)
            throw `Account hasn't received a custom asset yet. Do that first then try again.`
            
        if (new BigNubmer(customAsset.selling_liabilities).gt(0))
            return console.log(`Account has already issued a sell offer for its custom asset`)
        
        const sellAsset = new Asset(customAsset.asset_code, customAsset.asset_issuer)
    
        console.log(`Account exists and is ready to issue a sell offer for its custom asset`)
    
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.manageSellOffer({
            selling: sellAsset,
            buying: Asset.native(),
            amount: customAsset.balance,
            price: 1
        }))
        .setTimeout(0)
        .build()

        transaction.sign(myKeypair)

        console.log('Sell offer transaction has been prepared and signed')
        await server.submitTransaction(transaction)
        console.log('Sell offer transaction was successfully submitted')
    })
}

catch(err) {
    console.error(parseError(err))
}
