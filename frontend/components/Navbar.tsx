import React from "react";
import style from "../styles/Home.module.css";

import * as fcl from "@onflow/fcl";
import "../flow/config";
import { useState, useEffect } from "react";
import { Button } from "@chakra-ui/react";

const Navbar = () => {
    const [user, setUser] = useState<any>({ loggedIn: null });

    useEffect(() => {
        fcl.currentUser.subscribe(setUser);
    }, []);



    console.log(user);

    return (
        <div className={`h-16 items-center  flex font-sans justify-between px-4 `}>
            <div className=''>
                <h3 className='text-xl'>Flash <span className="text-red-400">
                    Loan
                </span>
                </h3>
            </div>
            <div className={' flex items-center gap-4'}>
                {user?.loggedIn && <div className="h-10 border-2 text-center p-2 rounded border-red-500">{user.addr}</div>}
                {!user?.loggedIn && <Button className="bg-red-400" onClick={fcl.logIn} >Login</Button>}
                {user?.loggedIn && <Button className="bg-red-400" onClick={fcl.unauthenticate} >Logout</Button>}

            </div>
        </div>
    );
};

export default Navbar;
