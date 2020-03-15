import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";


process.on("unhandledRejection", (error) => {
    // tslint:disable-next-line
    console.error("unhandledRejection", error);
    process.exit(1);
});


chai.use(chaiAsPromised);

export const expect = chai.expect;
