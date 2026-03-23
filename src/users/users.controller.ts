import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe, ValidationPipe, Put } from '@nestjs/common';
import { Role } from './role.enum';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';



@Controller('users')
export class UsersController {

    /*
    GET /users
    GET /users/:id
    POST /users
    PATCH /users/:id
    DELETE /users/:id
    */
   constructor(private readonly userService: UsersService){}

    @Get() //users
    findAll(@Query('role')role?: Role){
        return this.userService.findAll(role);
    };

    @Get(':id') //users/:id
    findOne(@Param('id', ParseIntPipe) id: number){
        return this.userService.findOne(id);
    };
   
    @Post() //users/
    create(@Body(ValidationPipe) createUserDto: CreateUserDto){
        return this.userService.create(createUserDto)
    };

    @Patch(':id')//users/:id
    update(@Param('id', ParseIntPipe) id : number, @Body(ValidationPipe) updateUserDto :UpdateUserDto){
        return this.userService.update(id, updateUserDto);
    };

    @Delete(':id')//users/:id
    delete(@Param('id', ParseIntPipe) id : number){
        return this.userService.delete(id);
    };



    
}
