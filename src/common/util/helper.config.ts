


export interface ApiResponse {
    status: string,
    message: string,
    data: any,
}

export const responseMessageGenerator = async (status: string, message: string, data?: any): Promise<ApiResponse> => {  
   const format = {
        status,
        message,
        data: data
    }
    return format
  
}

export const jwtConstants = {
    secret: 'f98baadf322a8a7fac3a.',
 
}