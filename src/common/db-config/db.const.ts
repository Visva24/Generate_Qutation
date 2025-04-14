import { SequelizeModuleOptions } from "@nestjs/sequelize";

const generateSequelizeOptions = async (): Promise<SequelizeModuleOptions> => {
  try {
    const databaseConfig: SequelizeModuleOptions = {
      dialect: "mysql",
      timezone: "+05:30", // Indian Standard Time (IST) timezone offset
      port: 3306,
      host: "mysql-db", // Change this to the container name of your MySQL container
      username: "test",
      password: "Admin@123123",
      database: "mydatabase",
      autoLoadModels: true,
      synchronize: true,
      sync: { alter: true }, // Synchronize models on app start
      logging: false, // Optional: set logging to false to suppress SQL logs in console
    };

    return databaseConfig;
  } catch (error) {
    console.error("Error generating Sequelize options:", error);
    throw error;
  }
};

export default generateSequelizeOptions;
