import { SequelizeModuleOptions } from "@nestjs/sequelize";


const generateSequelizeOptions = async (): Promise<SequelizeModuleOptions> => {
    try {

        const databaseConfig: SequelizeModuleOptions = {


            dialect: "mysql",
            timezone: '+05:30', // Indian Standard Time (IST) timezone offset
            port: 3306,
            username: "root",
            password: "",
            database: "qg",
            autoLoadModels: true,
            synchronize: true,
            // logging:false,
            // synchronize: true,
            // logging:false,
            // sync: { alter: true }, // Uncomment if needed for migrations
        };
        return databaseConfig;
    } catch (error) {
        console.error("Error generating Sequelize options:", error);
        throw error;
    }
};


export default generateSequelizeOptions;
