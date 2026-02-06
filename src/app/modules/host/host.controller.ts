import { Request, Response } from 'express';
 
import { hostFilterableFields } from './host.constants';
import catchAsync from '../../shared/catchAsync';
import pick from '../../helper/pick';
import sendResponse from '../../shared/sendResponse';
import { HostService } from './host.service';
//controller functions
const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, hostFilterableFields);

    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await HostService.getAllFromDB(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Hosts retrieval successfully',
        meta: result.meta,
        data: result.data,
    });
});
// get host by id
const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HostService.getByIdFromDB(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Host retrieval successfully',
        data: result,
    });
});

const updateIntoDB = catchAsync(async (req: Request, res: Response) => {

    const { id } = req.params;
    const result = await HostService.updateIntoDB(id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Host data updated!",
        data: result
    })
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HostService.deleteFromDB(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Host deleted successfully',
        data: result,
    });
});


const softDelete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HostService.softDelete(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Host soft deleted successfully',
        data: result,
    });
});

 
export const HostController = {
    updateIntoDB,
    getAllFromDB,
    getByIdFromDB,
    deleteFromDB,
    softDelete,
  
}