"use client";
import { AuthContext } from "@/app/contexts/AuthContext";
import { CartContext } from "@/app/contexts/CartContext";
import { DeliveryAuthContext } from "@/app/contexts/DeliveryAuthContext";
import { UserAuthContext } from "@/app/contexts/UserAuthContext";
import { delivery_auth, restaurant_auth, user_auth } from "@/app/helpers/helper"
import { toast } from "react-toastify";
import { deleteCookie } from "cookies-next";
import Link from "next/link"
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
const Header = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const { user, setUser } = useContext(UserAuthContext);
  const { delivery, setDelivery } = useContext(DeliveryAuthContext);
  const { cart, setCart } = useContext(CartContext);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target) && window.innerWidth < 1024) {
      closeMenu();
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    // Cleanup
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    handleResize();
    // Attach the resize event listener
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResize = () => {
    // Close the menu if the window is resized to a width larger than a breakpoint (e.g., 1024px)
    if (window.innerWidth >= 1024) {
      setIsMenuOpen(true);
    }
    else{
      setIsMenuOpen(false);
    }
  };

  const Logout = async (type) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out now!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (type == 1) {
          deleteCookie('user_auth');
          setUser(user_auth());
        }
        else if (type == 2) {
          deleteCookie('restaurant_auth');
          setAuth(restaurant_auth());
        }
        else if (type == 3) {
          deleteCookie('delivery_auth');
          setDelivery(delivery_auth());
        }

        toast.success('Logout successfully.');
        router.push('/');
      }
    });
  }
  return (
    <div>
      <header className='flex shadow-md py-4 px-4 sm:px-10 bg-white font-[sans-serif] min-h-[70px] tracking-wide relative z-50'>
        <div className='flex flex-wrap items-center justify-between gap-5 w-full'>
          <Link href="/"><img src="/logo.png" alt="logo" className='w-12' />
          </Link>

          <div  id="collapseMenu"
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } max-lg:before:fixed max-lg:before:bg-black max-lg:before:opacity-50 max-lg:before:inset-0 max-lg:before:z-50`}>
            <button title="Close Menu" onClick={()=> closeMenu()} id="toggleClose" className='lg:hidden fixed top-2 right-4 z-[100] rounded-full bg-white p-3'>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 fill-black" viewBox="0 0 320.591 320.591">
                <path
                  d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z"
                  data-original="#000000"></path>
                <path
                  d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z"
                  data-original="#000000"></path>
              </svg>
            </button>

            <ul
              className='lg:flex gap-x-5 max-lg:space-y-3 max-lg:fixed max-lg:bg-white max-lg:w-1/2 max-lg:min-w-[300px] max-lg:top-0 max-lg:left-0 max-lg:p-6 max-lg:h-full max-lg:shadow-md max-lg:overflow-auto z-50'>
              <li className='mb-6 hidden max-lg:block'>
                <a href="#"><img src="/logo.png" alt="logo" className='w-36' />
                </a>
              </li>
              <li className='max-lg:border-b border-gray-300 max-lg:py-3 px-3'>
                <Link href='/'
                  className='hover:text-[#007bff] text-[#007bff] block font-semibold text-[15px]'>Home</Link>
              </li>
              {
                (user || auth || delivery) &&
                (<li className='max-lg:border-b border-gray-300 max-lg:py-3 px-3'>
                  <Link href={`/${user ? 'user' : (auth ? 'restaurant' : 'delivery') }/dashboard`}
                    className='hover:text-[#007bff] text-gray-500 block font-semibold text-[15px]'>Dashboard</Link>
                </li>)
              }
              <li className='max-lg:border-b border-gray-300 max-lg:py-3 px-3'><a href='#'
                className='hover:text-[#007bff] text-gray-500 block font-semibold text-[15px]'>About</a>
              </li>
              <li className='max-lg:border-b border-gray-300 max-lg:py-3 px-3'><a href='#'
                className='hover:text-[#007bff] text-gray-500 block font-semibold text-[15px]'>Contact</a>
              </li>
              {
                (user || auth || delivery) &&
                (<li className='max-lg:border-b border-gray-300 max-lg:py-3 px-3'>
                  <Link href={`/${user ? 'user' : (auth ? 'restaurant' : 'delivery') }/profile`}
                    className='hover:text-[#007bff] text-gray-500 block font-semibold text-[15px]'>Profile</Link>
                </li>)
              }
              <li className='max-lg:border-b border-gray-300 max-lg:py-3 px-3'><Link href="/cart"
                className='hover:text-[#007bff] text-gray-500 block font-semibold text-[15px]'>Cart <small className="text-red-600">({cart.length})</small></Link>
              </li>
            </ul>
          </div>
          {
            user ?
              (
                <button
                  onClick={() => Logout(1)}
                  className='px-4 py-2 text-sm rounded-full font-bold text-white border-2 border-red bg-red-500 transition-all ease-in-out duration-300 hover:bg-transparent hover:text-[#007bff]'>Logout</button>
              )
              :
              (
                <Link
                  href="/user"
                  className='px-4 py-2 text-sm rounded-full font-bold text-white border-2 border-white bg-purple-500 transition-all ease-in-out duration-300 hover:bg-black hover:text-white'>Login</Link>
              )
          }

          <div className='flex max-lg:ml-auto space-x-3'>
            {
              auth ?
                (
                  <button
                    onClick={() => Logout(2)}
                    className='px-4 py-2 text-sm rounded-full font-bold text-white border-2 border-red bg-red-500 transition-all ease-in-out duration-300 hover:bg-transparent hover:text-[#007bff]'>Logout</button>
                )
                :
                (
                  <Link
                    href="/restaurant"
                    className='px-4 py-2 text-sm rounded-full font-bold text-white border-2 border-green bg-green-500 transition-all ease-in-out duration-300 hover:bg-transparent hover:text-[#007bff]'>Business Login</Link>
                )
            }
          </div>
          <div className='flex max-lg:ml-auto space-x-3'>
            {
              delivery ?
                (
                  <button
                    onClick={() => Logout(3)}
                    className='px-4 py-2 text-sm rounded-full font-bold text-white border-2 border-red bg-red-500 transition-all ease-in-out duration-300 hover:bg-transparent hover:text-[#007bff]'>Logout</button>
                )
                :
                (
                  <Link
                    href="/delivery"
                    className='px-4 py-2 text-sm rounded-full font-bold text-white border-2 border-[#007bff] bg-[#007bff] transition-all ease-in-out duration-300 hover:bg-transparent hover:text-[#007bff]'>Delivery Login</Link>
                )
            }

            <button title="Toggle Menu" ref={menuRef} onClick={()=> toggleMenu()} id="toggleOpen" className='lg:hidden'>
              <svg className="w-7 h-7" fill="#000" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}

export default Header