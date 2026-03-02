import { PaginationDto } from '../../../common/dto/pagination.dto';

// search is inherited from PaginationDto — this alias exists for clarity in the controller
export class ListCustomersDto extends PaginationDto {}
