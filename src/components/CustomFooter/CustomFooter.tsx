"use client";
import Link from 'next/link'
import { FooterForm } from './FooterForm'

export const CustomFooter = () => {
    const footerLinks = [
        {
            title: "Properties Categories",
            links: [
                {
                    title: 'Temperature',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Pressure',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Level',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Flow',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Air Quality',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Humidity & Temperature',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'BAS & HVAC',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
            ]
        },
        {
            title: "Properties Categories",
            links: [
                {
                    title: 'PID Temperature ',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'ControllersRTDsIT ',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'ServiceBAS & ',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'HVACLevel GaugesIT ',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'ServiceApplications by ',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'IndustryFlow ',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
            ]
        },
        {
            title: "Automation",
            links: [
                {
                    title: 'EMS',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'RIOT',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'RIOT',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Door Interlock System',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Datalogging System',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Process Automation',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Energy Monitoring',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Control Panels',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
            ]
        },
        {
            title: "Company",
            links: [
                {
                    title: 'About Us',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Careers',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Downloads',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
                {
                    title: 'Blogs',
                    link: "https://uat-fe.radix.logicloop.io/",
                },
            ]
        }
    ]
    const socialmedia = [
        {
            icon: '/images/fb.svg',
            href: '/',
        },
        {
            icon: '/images/tw.svg',
            href: '/',
        },
        {
            icon: '/images/li.svg',
            href: '/',
        },
        {
            icon: '/images/insta.svg',
            href: '/',
        }
    ]
    const subfooter = [
        {
            title: "Disclaimer",
            link: "https://uat-fe.radix.logicloop.io/"
        },
        {
            title: "Privacy",
            link: "https://uat-fe.radix.logicloop.io/"
        },
        {
            title: "Terms",
            link: "https://uat-fe.radix.logicloop.io/"
        },
    ]
    return (
        <div className='custom-footer pt-7 overflow-hidden'>
            <div className='mx-auto lg:w-10 md:w-11 sm:w-12'>
                <div className="grid nested-grid">
                    <div className="col-3">
                        <div>
                            <img
                                alt='logo'
                                src={'/images/radix-logo-white.png'}
                            />
                        </div>
                        <div className='font-semibold text-xl text-white mt-3'>
                            Connect with us
                        </div>
                        <div className='flex gap-3 mt-2'>
                            {socialmedia.map((social, i) => (
                                <div key={i} className='border-circle border-white border-1 flex align-items-center justify-content-center' style={{ height: 37, width: 37, padding: 8, }}>
                                    <img
                                        src={social.icon}
                                        alt={'icon' + i}
                                    />
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className='mt-4 mt-sm-0 mt-lg-4'>
                                <div className='text-white font-semibold text-xl'>Office</div>
                                <div className='flex align-items-center gap-3 mt-2'>
                                    <div className='mb-2'>
                                        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13.4375 0C14.0469 0 14.5625 0.234375 15.0312 0.65625C15.4531 1.125 15.6875 1.64062 15.6875 2.25V21.75C15.6875 22.4062 15.4531 22.9219 15.0312 23.3438C14.5625 23.8125 14.0469 24 13.4375 24H2.9375C2.28125 24 1.76562 23.8125 1.34375 23.3438C0.875 22.9219 0.6875 22.4062 0.6875 21.75V2.25C0.6875 1.64062 0.875 1.125 1.34375 0.65625C1.76562 0.234375 2.28125 0 2.9375 0H13.4375ZM8.1875 22.5C8.5625 22.5 8.9375 22.3594 9.21875 22.0781C9.5 21.7969 9.6875 21.4219 9.6875 21C9.6875 20.625 9.5 20.25 9.21875 19.9688C8.9375 19.6875 8.5625 19.5 8.1875 19.5C7.76562 19.5 7.39062 19.6875 7.10938 19.9688C6.82812 20.25 6.6875 20.625 6.6875 21C6.6875 21.4219 6.82812 21.7969 7.10938 22.0781C7.39062 22.3594 7.76562 22.5 8.1875 22.5ZM13.4375 17.4375V2.8125C13.4375 2.67188 13.3438 2.53125 13.25 2.4375C13.1562 2.34375 13.0156 2.25 12.875 2.25H3.5C3.3125 2.25 3.17188 2.34375 3.07812 2.4375C2.98438 2.53125 2.9375 2.67188 2.9375 2.8125V17.4375C2.9375 17.625 2.98438 17.7656 3.07812 17.8594C3.17188 17.9531 3.3125 18 3.5 18H12.875C13.0156 18 13.1562 17.9531 13.25 17.8594C13.3438 17.7656 13.4375 17.625 13.4375 17.4375Z" fill="white" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className='text-white text-base font-semibold m-0'>
                                            +91 22 42537777
                                            <br />
                                            +91 22 42537707
                                        </p>
                                    </div>
                                </div>
                                <div className='flex align-items-center gap-3 mt-3'>
                                    <div className=''>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.00781 3H19.9922C20.8516 3.01562 21.5625 3.30859 22.125 3.87891C22.6875 4.44922 22.9766 5.15625 22.9922 6V18C22.9766 18.8438 22.6875 19.5508 22.125 20.1211C21.5625 20.6914 20.8516 20.9844 19.9922 21H4.00781C3.14844 20.9844 2.4375 20.6914 1.875 20.1211C1.3125 19.5508 1.02344 18.8438 1.00781 18V6C1.02344 5.15625 1.3125 4.44922 1.875 3.87891C2.4375 3.30859 3.14844 3.01562 4.00781 3ZM20.8828 5.55469C20.8047 5.38281 20.6875 5.25 20.5312 5.15625C20.375 5.0625 20.1953 5.00781 19.9922 4.99219H4.00781C3.80469 5.00781 3.625 5.0625 3.46875 5.15625C3.3125 5.25 3.19531 5.38281 3.11719 5.55469L12 11.7891L20.8828 5.55469ZM21 7.92188L12.5625 13.8281C12.3906 13.9375 12.2031 13.9922 12 13.9922C11.7969 13.9922 11.6094 13.9375 11.4375 13.8281L3 7.92188V18C3 18.2812 3.09766 18.5156 3.29297 18.7031C3.48828 18.8906 3.72656 18.9922 4.00781 19.0078H19.9922C20.2734 18.9922 20.5117 18.8906 20.707 18.7031C20.9023 18.5156 21 18.2812 21 18V7.92188Z" fill="white" />
                                        </svg>
                                    </div>
                                    <p className='text-white text-base font-semibold m-0'>
                                        esales@radix.co.in
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-9">
                        <div className="grid">
                            {footerLinks.map((footer, i) => (
                                <div key={i} className='col-3'>
                                    <div className='flex flex-column mt-4 mt-lg-0'>
                                        <div className='font-semibold text-nowrap text-xl mb-3' style={{ color: i === 1 ? 'transparent' : '#fff', userSelect: 'none' }}>{footer.title}</div>
                                        {footer.links.map((links, i) => (
                                            <Link key={i} href={process.env.BASE_FRONTEND_APPLICATION as string} className='text-white no-underline text-base font-semibold m-0 line-height-4'>
                                                {links.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='py-3 mt-3' style={{ borderTop: '1px solid #1F6585', borderBottom: '1px solid #1F6585' }}>
                    <div className='grid'>
                        <div className='lg:col-6 md:col-12'>
                            <div className='text-xl font-semibold text-white mb-1'>
                                Subscribe to our product mailers
                            </div>
                            <p className='text-sm text-white mb-0'>
                                Get notified about updates and be the first to get early access to new episodes.
                            </p>
                        </div>
                        <div className='lg:col-6 md:col-12'>
                            <FooterForm />
                        </div>
                    </div>
                </div>
                <div className='py-4 flex sm:flex-column md:flex-row align-items-center justify-content-between'>
                    <div className='flex align-items-center'>
                        {subfooter.map((link, i) => (
                            <Link key={i} href={link.link} className='text-white no-underline text-base font-semibold m-0'>
                                {link.title}
                                {i < subfooter.length - 1 && <span className='mx-3'>|</span>}
                            </Link>
                        ))}
                    </div>
                    <div>
                        <p className='mb-0 mt-2 mt-sm-0 text-base text-white font-semibold'>
                            © 2024.All Rights Reserved
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}